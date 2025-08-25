import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Developer from "@/models/developers";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectToDatabase();
    
    const { slug } = params;
    console.log("Received DELETE request for slug:", params.slug);
    const developer = await Developer.findOne({ slug });

    if (!developer) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    await Developer.deleteOne({ _id: developer._id });

    return NextResponse.json({
      success: true,
      message: "Developer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Developer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
