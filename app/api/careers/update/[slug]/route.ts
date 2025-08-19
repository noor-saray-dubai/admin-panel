import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Career from "@/models/careers";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";

interface CareerUpdateData {
    title?: string;
    department?: string;
    location?: string;
    type?: "Full-time" | "Part-time" | "Contract" | "Internship";
    level?: "Entry" | "Mid" | "Senior" | "Executive";
    salary?: string;
    description?: string;
    requirements?: string[];
    responsibilities?: string[];
    benefits?: string[];
    status?: "Active" | "Paused" | "Closed";
    postedDate?: string | Date;
    applicationDeadline?: string | Date;
    applicationsCount?: number;
    featured?: boolean;
    tags?: string[];
}

/**
 * Generate career slug from title
 */
function generateCareerSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .substring(0, 100); // Limit length
}

/**
 * Ensure unique slug (excluding current career)
 */
async function ensureUniqueSlug(baseSlug: string, currentCareer: any): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await Career.findOne({
            slug,
            isActive: true,
            _id: { $ne: currentCareer._id } // Exclude current career
        });

        if (!existing) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

/**
 * Validate partial update data
 */
function validateUpdateData(data: CareerUpdateData, existingCareer: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[]
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Helper function for string validation
    const validateString = (value: any, fieldName: string, minLength = 1, maxLength = Infinity): boolean => {
        if (value === undefined) return true; // Optional field for updates

        if (typeof value !== "string") {
            errors.push(`${fieldName} must be a string.`);
            return false;
        }

        const trimmed = value.trim();
        if (trimmed.length < minLength) {
            errors.push(`${fieldName} must be at least ${minLength} characters long.`);
            return false;
        }

        if (trimmed.length > maxLength) {
            errors.push(`${fieldName} must not exceed ${maxLength} characters.`);
            return false;
        }

        return true;
    };

    // Validate provided fields
    if (data.title !== undefined) {
        validateString(data.title, "title", 2, 150);

        // Check for title conflicts (excluding current career)
        if (data.title.trim().toLowerCase() !== existingCareer.title.toLowerCase()) {
            warnings.push("Changing career title will update the slug and may affect SEO.");
        }
    }

    validateString(data.department, "department", 2, 100);
    validateString(data.location, "location", 2, 100);
    validateString(data.salary, "salary", 1, 100);
    validateString(data.description, "description", 10, 5000);

    // Validate enums if provided
    if (data.type !== undefined) {
        const validTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
        if (!validTypes.includes(data.type)) {
            errors.push(`type must be one of: ${validTypes.join(', ')}`);
        }
    }

    if (data.level !== undefined) {
        const validLevels = ['Entry', 'Mid', 'Senior', 'Executive'];
        if (!validLevels.includes(data.level)) {
            errors.push(`level must be one of: ${validLevels.join(', ')}`);
        }
    }

    if (data.status !== undefined) {
        const validStatuses = ['Active', 'Paused', 'Closed'];
        if (!validStatuses.includes(data.status)) {
            errors.push(`status must be one of: ${validStatuses.join(', ')}`);
        }

        if (data.status !== existingCareer.status) {
            warnings.push("Status change may affect career visibility and applications.");
        }
    }

    // Numeric validations
    if (data.applicationsCount !== undefined) {
        if (typeof data.applicationsCount !== "number" || data.applicationsCount < 0) {
            errors.push("applicationsCount must be a non-negative number.");
        }
    }

    // Boolean validations
    if (data.featured !== undefined && typeof data.featured !== "boolean") {
        errors.push("featured must be a boolean.");
    }

    // Date validations
    if (data.postedDate !== undefined) {
        const postedDate = new Date(data.postedDate);
        if (isNaN(postedDate.getTime())) {
            errors.push("postedDate must be a valid date.");
        }
    }

    if (data.applicationDeadline !== undefined) {
        const applicationDeadline = new Date(data.applicationDeadline);
        if (isNaN(applicationDeadline.getTime())) {
            errors.push("applicationDeadline must be a valid date.");
        }

        // Cross-validate dates
        const postedDate = data.postedDate ? new Date(data.postedDate) : existingCareer.postedDate;
        if (applicationDeadline <= postedDate) {
            errors.push("Application deadline must be after posted date.");
        }
    }

    // Array validations
    if (data.requirements !== undefined) {
        if (!Array.isArray(data.requirements) || data.requirements.length === 0) {
            errors.push("At least one requirement is needed.");
        } else {
            data.requirements.forEach((req, idx) => {
                validateString(req, `requirement[${idx}]`, 1, 500);
            });
        }
    }

    if (data.responsibilities !== undefined) {
        if (!Array.isArray(data.responsibilities) || data.responsibilities.length === 0) {
            errors.push("At least one responsibility is needed.");
        } else {
            data.responsibilities.forEach((resp, idx) => {
                validateString(resp, `responsibility[${idx}]`, 1, 500);
            });
        }
    }

    if (data.benefits !== undefined) {
        if (!Array.isArray(data.benefits) || data.benefits.length === 0) {
            errors.push("At least one benefit is needed.");
        } else {
            data.benefits.forEach((benefit, idx) => {
                validateString(benefit, `benefit[${idx}]`, 1, 500);
            });
        }
    }

    if (data.tags !== undefined) {
        if (!Array.isArray(data.tags)) {
            errors.push("tags must be an array.");
        } else {
            data.tags.forEach((tag, idx) => {
                validateString(tag, `tag[${idx}]`, 1, 50);
            });
        }
    }

    return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Sanitize update data
 */
function sanitizeUpdateData(data: CareerUpdateData): CareerUpdateData {
    const sanitized: CareerUpdateData = {};

    const sanitizeString = (str: string): string => str.trim().replace(/\s+/g, ' ');

    // Sanitize string fields
    if (data.title !== undefined) sanitized.title = sanitizeString(data.title);
    if (data.department !== undefined) sanitized.department = sanitizeString(data.department);
    if (data.location !== undefined) sanitized.location = sanitizeString(data.location);
    if (data.salary !== undefined) sanitized.salary = sanitizeString(data.salary);
    if (data.description !== undefined) sanitized.description = sanitizeString(data.description);

    // Copy non-string fields as-is
    ['type', 'level', 'status', 'postedDate', 'applicationDeadline', 'applicationsCount', 'featured'].forEach(field => {
        if ((data as any)[field] !== undefined) {
            (sanitized as any)[field] = (data as any)[field];
        }
    });

    // Sanitize arrays
    if (data.requirements) {
        sanitized.requirements = data.requirements.map(req => sanitizeString(req)).filter(req => req.length > 0);
    }

    if (data.responsibilities) {
        sanitized.responsibilities = data.responsibilities.map(resp => sanitizeString(resp)).filter(resp => resp.length > 0);
    }

    if (data.benefits) {
        sanitized.benefits = data.benefits.map(benefit => sanitizeString(benefit)).filter(benefit => benefit.length > 0);
    }

    if (data.tags) {
        sanitized.tags = data.tags.map(tag => sanitizeString(tag)).filter(tag => tag.length > 0);
    }

    return sanitized;
}

/**
 * Check if user has permission to update career
 */
function canUpdateCareer(user: any, career: any): { canUpdate: boolean; reason?: string } {
    // Admin can update any career
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    if (adminEmails.includes(user.email)) {
        return { canUpdate: true };
    }

    // Career creator can update their own career
    if (career.createdBy?.email === user.email) {
        return { canUpdate: true };
    }

    // HR department can update careers
    const hrEmails = process.env.HR_EMAILS?.split(',').map(e => e.trim()) || [];
    if (hrEmails.includes(user.email)) {
        return { canUpdate: true };
    }

    return {
        canUpdate: false,
        reason: "You don't have permission to update this career"
    };
}

/**
 * Main PUT handler with authentication
 */
export const PUT = withAuth(async (
    request: NextRequest,
    { user, audit },
    { params }: { params: { slug: string } }
) => {
    try {
        // Apply rate limiting
        const rateLimitResult = await rateLimit(request, user);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "RATE_LIMITED",
                    message: "Too many requests. Please try again later.",
                    retryAfter: rateLimitResult.retryAfter
                },
                { status: 429 }
            );
        }

        // Connect to database
        await connectToDatabase();

        const { slug } = params;

        // Find existing career
        const existingCareer = await Career.findOne({ slug, isActive: true });
        if (!existingCareer) {
            return NextResponse.json(
                { success: false, message: "Career not found", error: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // Check permissions
        const permissionCheck = canUpdateCareer(user, existingCareer);
        if (!permissionCheck.canUpdate) {
            return NextResponse.json(
                {
                    success: false,
                    message: permissionCheck.reason || "Insufficient permissions",
                    error: "FORBIDDEN"
                },
                { status: 403 }
            );
        }

        // Parse request body
        let updateData: CareerUpdateData;
        try {
            updateData = await request.json();
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return NextResponse.json(
                { success: false, message: "Invalid JSON data", error: "INVALID_JSON" },
                { status: 400 }
            );
        }

        // Sanitize data
        updateData = sanitizeUpdateData(updateData);

        // Validate update data
        const validation = validateUpdateData(updateData, existingCareer);
        if (!validation.isValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    errors: validation.errors,
                    warnings: validation.warnings,
                    error: "VALIDATION_ERROR"
                },
                { status: 400 }
            );
        }

        // Check for title conflicts if title is being changed
        if (updateData.title && updateData.title.trim().toLowerCase() !== existingCareer.title.toLowerCase()) {
            const titleConflict = await Career.findOne({
                title: { $regex: new RegExp(`^${updateData.title}$`, "i") },
                _id: { $ne: existingCareer._id },
                isActive: true
            });

            if (titleConflict) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Career with this title already exists",
                        error: "DUPLICATE_TITLE"
                    },
                    { status: 409 }
                );
            }
        }

        // Generate updated slug if title changed
        let updatedSlug = existingCareer.slug;
        if (updateData.title && updateData.title !== existingCareer.title) {
            const baseSlug = generateCareerSlug(updateData.title);
            updatedSlug = await ensureUniqueSlug(baseSlug, existingCareer);
        }

        // Prepare update object
        const updateObject = {
            ...updateData,
            slug: updatedSlug,
            updatedBy: audit,
            updatedAt: new Date(),
        };

        // Convert date strings to Date objects
        if (updateData.postedDate) {
            updateObject.postedDate = new Date(updateData.postedDate);
        }
        if (updateData.applicationDeadline) {
            updateObject.applicationDeadline = new Date(updateData.applicationDeadline);
        }

        // Update career with optimistic locking
        const updatedCareer = await Career.findOneAndUpdate(
            {
                _id: existingCareer._id,
                version: existingCareer.version // Optimistic locking
            },
            {
                $set: updateObject,
                $inc: { version: 1 }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedCareer) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Career was modified by another user. Please refresh and try again.",
                    error: "CONFLICT"
                },
                { status: 409 }
            );
        }

        // Log successful update
        console.log(`Career updated successfully by ${user.email}:`, {
            id: updatedCareer._id,
            title: updatedCareer.title,
            slug: updatedCareer.slug,
            changes: Object.keys(updateData)
        });

        // Return success response
        return NextResponse.json(
            {
                success: true,
                message: "Career updated successfully",
                warnings: validation.warnings,
                career: {
                    id: updatedCareer._id,
                    title: updatedCareer.title,
                    slug: updatedCareer.slug,
                    department: updatedCareer.department,
                    location: updatedCareer.location,
                    type: updatedCareer.type,
                    level: updatedCareer.level,
                    status: updatedCareer.status,
                    featured: updatedCareer.featured,
                    postedDate: updatedCareer.postedDate,
                    applicationDeadline: updatedCareer.applicationDeadline,
                    applicationsCount: updatedCareer.applicationsCount,
                    updatedAt: updatedCareer.updatedAt,
                    updatedBy: updatedCareer.updatedBy.email,
                    version: updatedCareer.version
                },
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Error updating career:", error);

        // Handle specific error types
        if (error.name === "ValidationError") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Database validation error",
                    errors: Object.values(error.errors).map((err: any) => err.message),
                    error: "DB_VALIDATION_ERROR",
                },
                { status: 400 }
            );
        }

        if (error.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Duplicate entry error",
                    error: "DUPLICATE_ENTRY",
                },
                { status: 409 }
            );
        }

        // Generic server error
        return NextResponse.json(
            {
                success: false,
                message: "An unexpected error occurred",
                error: "INTERNAL_ERROR"
            },
            { status: 500 }
        );
    }
});