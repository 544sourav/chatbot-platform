import type { Request, Response } from "express";
import { success, z } from "zod";
import { prisma } from "../lib/prisma.js";

const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
});

interface CompanyParams {
  id: string;
}
export async function createCompany(req: Request, res: Response) {
  try {
    const parsed = createCompanySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.flatten(),
      });
    }

    const company = await prisma.company.create({
      data: {
        name: parsed.data.name,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        apiKey: company.apiKey,
      },
    });
  } catch (err) {
    console.error(err);

    if (err instanceof Error) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function getCompanyById(req: Request<CompanyParams>, res: Response) {
  try {
    const companyId = req.params.id;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (err) {
    console.error(err);

    if (err instanceof Error) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}