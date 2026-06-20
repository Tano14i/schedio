import { NextResponse } from "next/server";

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonCreated(data: unknown) {
  return NextResponse.json(data, { status: 201 });
}

export function jsonUpdated(data: unknown) {
  return NextResponse.json(data, { status: 200 });
}
