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
    await prisma.group.delete({
      where: { id: params.id },
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

    const body = await req.json();
    const { members } = schema.parse(body);

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