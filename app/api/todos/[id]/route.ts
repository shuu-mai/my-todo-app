import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { ApiErrorResponse, TodoDto } from "../route";

export type UpdateTodoRequestBody = {
  isCompleted: boolean;
};

export type UpdateTodoResponse = {
  todo: TodoDto;
};

export type DeleteTodoResponse = {
  success: true;
};

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const body: ApiErrorResponse = { error: "unauthorized" };
    return NextResponse.json(body, { status: 401 });
  }

  const { id } = await params;
  const requestBody = (await request.json()) as UpdateTodoRequestBody;

  // user_id で絞り込み、自分の TODO 以外は更新できないようにする
  const { count } = await prisma.todo.updateMany({
    where: { id, userId: user.id },
    data: { isCompleted: requestBody.isCompleted },
  });

  if (count === 0) {
    const body: ApiErrorResponse = { error: "todo not found" };
    return NextResponse.json(body, { status: 404 });
  }

  const todo = await prisma.todo.findUniqueOrThrow({ where: { id } });

  const body: UpdateTodoResponse = {
    todo: {
      id: todo.id,
      title: todo.title,
      isCompleted: todo.isCompleted,
      createdAt: todo.createdAt.toISOString(),
    },
  };
  return NextResponse.json(body);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const body: ApiErrorResponse = { error: "unauthorized" };
    return NextResponse.json(body, { status: 401 });
  }

  const { id } = await params;

  // user_id で絞り込み、自分の TODO 以外は削除できないようにする
  const { count } = await prisma.todo.deleteMany({
    where: { id, userId: user.id },
  });

  if (count === 0) {
    const body: ApiErrorResponse = { error: "todo not found" };
    return NextResponse.json(body, { status: 404 });
  }

  const body: DeleteTodoResponse = { success: true };
  return NextResponse.json(body);
}
