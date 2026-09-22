import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type TodoDto = {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
};

export type GetTodosResponse = {
  todos: TodoDto[];
};

export type CreateTodoRequestBody = {
  title: string;
};

export type CreateTodoResponse = {
  todo: TodoDto;
};

export type ApiErrorResponse = {
  error: string;
};

function toDto(todo: {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
}): TodoDto {
  return {
    id: todo.id,
    title: todo.title,
    isCompleted: todo.isCompleted,
    createdAt: todo.createdAt.toISOString(),
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const body: ApiErrorResponse = { error: "unauthorized" };
    return NextResponse.json(body, { status: 401 });
  }

  const todos = await prisma.todo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const body: GetTodosResponse = { todos: todos.map(toDto) };
  return NextResponse.json(body);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const body: ApiErrorResponse = { error: "unauthorized" };
    return NextResponse.json(body, { status: 401 });
  }

  const requestBody = (await request.json()) as CreateTodoRequestBody;
  const title = requestBody.title?.trim();

  if (!title) {
    const body: ApiErrorResponse = { error: "title is required" };
    return NextResponse.json(body, { status: 400 });
  }

  const todo = await prisma.todo.create({
    data: { title, userId: user.id },
  });

  const body: CreateTodoResponse = { todo: toDto(todo) };
  return NextResponse.json(body, { status: 201 });
}
