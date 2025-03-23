import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        expenses: {
          include: {
            paidBy: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Fetch group error:", error);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user ID from the request
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the user is an admin of the group
    const groupMember = await prisma.groupMember.findFirst({
      where: {
        groupId: params.id,
        userId: userId,
        role: "ADMIN"
      }
    });

    if (!groupMember) {
      return NextResponse.json(
        { error: "Only group admins can delete the group" },
        { status: 403 }
      );
    }

    // Use a transaction to ensure all related records are deleted
    await prisma.$transaction(async (tx) => {
      // 1. Delete all splits related to the group's expenses
      await tx.split.deleteMany({
        where: {
          expense: {
            groupId: params.id
          }
        }
      });

      // 2. Delete all settlements for the group
      await tx.settlement.deleteMany({
        where: {
          groupId: params.id
        }
      });

      // 3. Delete all expenses for the group
      await tx.expense.deleteMany({
        where: {
          groupId: params.id
        }
      });

      // 4. Delete all group members
      await tx.groupMember.deleteMany({
        where: {
          groupId: params.id
        }
      });

      // 5. Finally, delete the group itself
      await tx.group.delete({
        where: {
          id: params.id
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete group error:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schema = z.object({
      members: z.array(z.string()),
    });

    // Get the user ID from the request
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { members } = schema.parse(body);

    // Check if the user is an admin of the group
    const groupMember = await prisma.groupMember.findFirst({
      where: {
        groupId: params.id,
        userId: userId,
        role: "ADMIN"
      }
    });

    if (!groupMember) {
      return NextResponse.json(
        { error: "Only group admins can manage members" },
        { status: 403 }
      );
    }

    // First, verify the group exists
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        members: {
          where: { role: "ADMIN" },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Keep track of admin members
    const adminMemberIds = group.members.map(member => member.userId);

    // Delete existing non-admin members
    await prisma.groupMember.deleteMany({
      where: {
        groupId: params.id,
        role: "MEMBER",
        userId: {
          notIn: adminMemberIds
        }
      },
    });

    // Filter out admin members from the new members list
    const newMembers = members.filter(memberId => !adminMemberIds.includes(memberId));

    // Add new members if they don't already exist
    if (newMembers.length > 0) {
      await prisma.groupMember.createMany({
        data: newMembers.map((userId) => ({
          groupId: params.id,
          userId,
          role: "MEMBER",
        })),
        skipDuplicates: true,
      });
    }

    // Fetch updated group with all members
    const updatedGroup = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Update group members error:", error);
    return NextResponse.json(
      { error: "Failed to update group members" },
      { status: 400 }
    );
  }
}