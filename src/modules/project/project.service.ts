import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

import path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  // =========================================
  // CREATE
  // =========================================

  async create(dto: CreateProjectDto) {
    const { contactId, ...data } = dto;

    return await this.prisma.project.create({
      data: {
        ...data,

        startDate: dto.startDate
          ? new Date(dto.startDate)
          : new Date(),

        ...(dto.endDate && {
          endDate: new Date(dto.endDate),
        }),

        contact: {
          connect: {
            id: contactId,
          },
        },
      },

      include: {
        contact: true,
      },
    });
  }

  // =========================================
  // FIND ALL
  // =========================================

  async findAll() {
    return await this.prisma.project.findMany({
      include: {
        contact: true,
      },
    });
  }

  // =========================================
  // FIND ONE
  // =========================================

  async findOne(id: number) {
    return await this.prisma.project.findUnique({
      where: {
        id,
      },

      include: {
        contact: true,

        milestone: true,

        phases: {
          include: {
            deliverables: true,
          },
        },
      },
    });
  }

  // =========================================
  // FIND BY USER
  // =========================================

  async findByUser(userId: number) {
    return await this.prisma.project.findMany({
      where: {
        contact: {
          userId,
        },
      },

      include: {
        contact: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },

        milestone: true,

        phases: {
          include: {
            deliverables: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================
  // UPDATE
  // =========================================

  async update(id: number, dto: UpdateProjectDto) {
    const { contactId, ...data } = dto;

    return await this.prisma.project.update({
      where: {
        id,
      },

      data: {
        ...data,

        ...(dto.startDate && {
          startDate: new Date(dto.startDate),
        }),

        ...(dto.endDate && {
          endDate: new Date(dto.endDate),
        }),

        ...(contactId && {
          contact: {
            connect: {
              id: contactId,
            },
          },
        }),
      },

      include: {
        contact: true,
      },
    });
  }

  // =========================================
  // DELETE
  // =========================================

  async remove(id: number) {
    return await this.prisma.project.delete({
      where: {
        id,
      },
    });
  }

  // =========================================
  // MAP PROJECT TO PDF TEMPLATE
  // =========================================

  private mapProjectToTemplate(project: any) {
    return {
      title: project.title,

      description: project.description,

      status: project.status,

      startDate: new Date(
        project.startDate,
      ).toLocaleDateString(),

      endDate: project.endDate
        ? new Date(
            project.endDate,
          ).toLocaleDateString()
        : 'N/A',

      clientName:
        project.contact?.user?.name || 'N/A',

      clientEmail:
        project.contact?.user?.email || 'N/A',

      phases: project.phases.map((phase) => ({
        name: phase.name,

        description: phase.description,

        status: phase.status,

        startDate: new Date(
          phase.startDate,
        ).toLocaleDateString(),

        endDate: phase.endDate
          ? new Date(
              phase.endDate,
            ).toLocaleDateString()
          : 'N/A',

        deliverables: phase.deliverables.map(
          (deliverable) => ({
            name: deliverable.name,

            description:
              deliverable.description,

            status: deliverable.status,

            deadline: new Date(
              deliverable.deadline,
            ).toLocaleDateString(),
          }),
        ),
      })),

      milestones: project.milestone.map(
        (milestone) => ({
          name: milestone.name,

          description:
            milestone.description,

          status: milestone.status,

          deadline: new Date(
            milestone.deadline,
          ).toLocaleDateString(),
        }),
      ),
    };
  }

  // =========================================
  // GENERATE PDF BY ID
  // =========================================

  async generatePdfById(
    id: number,
    language: string,
  ): Promise<Buffer> {
    const project =
      await this.prisma.project.findUnique({
        where: {
          id,
        },

        include: {
          contact: {
            include: {
              user: true,
            },
          },

          phases: {
            include: {
              deliverables: true,
            },
          },

          milestone: true,
        },
      });

    if (!project) {
      throw new Error('Project not found');
    }

    const data =
      this.mapProjectToTemplate(project);

    return this.generatePdf(
      data,
      language,
    );
  }

  // =========================================
  // GENERATE PDF
  // =========================================

  async generatePdf(
    data: any,
    language: string,
  ): Promise<Buffer> {
    const templateName =
      language === 'fr'
        ? 'project-fr.hbs'
        : 'project-en.hbs';
console.log(language)
    const templatePath = path.join(
      process.cwd(),
      'src/modules/project/templates',
      templateName,
    );

    const templateHtml =
      fs.readFileSync(
        templatePath,
        'utf8',
      );

    const template =
      handlebars.compile(templateHtml);

    const html = template(data);

    let browser;

    // =========================================
    // PRODUCTION
    // =========================================

    if (process.env.NODE_ENV === 'PROD') {
      browser =
        await puppeteerCore.launch({
          executablePath:
            await chromium.executablePath(),

          args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ],

          headless: true,
        });
    }

    // =========================================
    // DEVELOPMENT
    // =========================================

    else {
      browser =
        await puppeteer.launch({
          headless: true,
        });
    }

    try {
      const page =
        await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'load',
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}