import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { origin } = new URL(req.url);
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'Digi Money Manager API Documentation',
      description: 'Interactive API testing console for Digi Money Manager backend. Uses JWT tokens for RBAC authentication.',
      version: '1.0.0',
    },
    servers: [
      {
        url: origin,
        description: 'Current host server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Input your JWT token (retrieved from Login response) to authorize protected requests.',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nama', 'email', 'password', 'role'],
                  properties: {
                    nama: { type: 'string', example: 'Taraka Yumna' },
                    email: { type: 'string', format: 'email', example: 'karyawan@digi.com' },
                    password: { type: 'string', minLength: 6, example: 'password123' },
                    role: { 
                      type: 'string', 
                      enum: ['Karyawan', 'Project Manager', 'Tim Keuangan', 'Direktur / Manajemen'],
                      example: 'Karyawan'
                    },
                    proyekId: { type: 'string', format: 'uuid', example: 'uuid-string' },
                    divisi: { type: 'string', example: 'Site Operations' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'User registered successfully' },
            400: { description: 'Validation error / Email already exists' }
          }
        }
      },
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User Login',
          description: 'Authenticates credentials, returns signed JWT token, and sets the auth_token cookie.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'pm@digi.com' },
                    password: { type: 'string', example: 'password123' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid email or password' }
          }
        }
      },
      '/api/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current user profile',
          responses: {
            200: { description: 'Profile retrieved successfully' },
            401: { description: 'Unauthorized: Invalid session' }
          }
        }
      },
      '/api/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'User Logout',
          description: 'Clears the authentication cookie.',
          responses: {
            200: { description: 'Logout successful' }
          }
        }
      },
      '/api/coa': {
        get: {
          tags: ['Chart of Accounts'],
          summary: 'List all Accounts',
          responses: {
            200: { description: 'List of CoA accounts' }
          }
        },
        post: {
          tags: ['Chart of Accounts'],
          summary: 'Create a new CoA account',
          description: 'Restricted: Tim Keuangan only.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nomorAkun', 'namaAkun', 'tipe', 'standar'],
                  properties: {
                    nomorAkun: { type: 'string', example: '50005' },
                    namaAkun: { type: 'string', example: 'Beban Konsumsi & Rapat' },
                    tipe: { type: 'string', example: 'Expense' },
                    standar: { type: 'string', example: 'IFRS' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'CoA created successfully' },
            403: { description: 'Forbidden: Insufficient role' }
          }
        }
      },
      '/api/coa/{id}': {
        put: {
          tags: ['Chart of Accounts'],
          summary: 'Update CoA Account details',
          description: 'Restricted: Tim Keuangan only.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    namaAkun: { type: 'string', example: 'Beban Konsumsi Site' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'CoA updated' },
            404: { description: 'CoA not found' }
          }
        },
        delete: {
          tags: ['Chart of Accounts'],
          summary: 'Delete CoA Account',
          description: 'Restricted: Tim Keuangan only.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'CoA deleted' }
          }
        }
      },
      '/api/proyek': {
        get: {
          tags: ['Projects & Budgets'],
          summary: 'List all projects',
          responses: {
            200: { description: 'List of projects with budget overview' }
          }
        },
        post: {
          tags: ['Projects & Budgets'],
          summary: 'Create a new project',
          description: 'Restricted: PM or Keuangan only.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nama', 'tanggalMulai'],
                  properties: {
                    nama: { type: 'string', example: 'Pembangunan Mess Karyawan' },
                    deskripsi: { type: 'string', example: 'Pembuatan mess karyawan site Bandung.' },
                    tanggalMulai: { type: 'string', format: 'date', example: '2026-06-15' },
                    tanggalSelesai: { type: 'string', format: 'date', example: '2026-12-15' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Project created' }
          }
        }
      },
      '/api/proyek/{id}': {
        get: {
          tags: ['Projects & Budgets'],
          summary: 'Get project details',
          description: 'Returns four budget components (RAB, Pengeluaran, Reimbursement, and Sisa Budget) (FR02).',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Project budget details' }
          }
        }
      },
      '/api/proyek/{id}/budget': {
        post: {
          tags: ['Projects & Budgets'],
          summary: 'Input project RAB allocations',
          description: 'Restricted: PM or Keuangan. The sum of category allocations must equal the total RAB (FR01).',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['rabTotal', 'posAnggaran'],
                  properties: {
                    rabTotal: { type: 'number', example: 50000000 },
                    posAnggaran: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['deskripsi', 'nominalAlokasi'],
                        properties: {
                          deskripsi: { type: 'string', example: 'Bahan Bangunan & Sipil' },
                          nominalAlokasi: { type: 'number', example: 50000000 }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'RAB budget set successfully' },
            400: { description: 'Allocation total sum mismatch' }
          }
        }
      },
      '/api/reimbursements': {
        get: {
          tags: ['Reimbursements'],
          summary: 'List reimbursements',
          description: 'Filtered dynamically: Employees see own, PM sees pending for project, Finance/Executive see all.',
          responses: {
            200: { description: 'List of reimbursements' }
          }
        },
        post: {
          tags: ['Reimbursements'],
          summary: 'Submit reimbursement request',
          description: 'Allows Karyawan to submit a request. Accepts JSON or multipart/form-data for receipt file upload.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['proyekId', 'posAnggaranId', 'nominal'],
                  properties: {
                    proyekId: { type: 'string', format: 'uuid', example: 'project-uuid' },
                    posAnggaranId: { type: 'string', format: 'uuid', example: 'pos-anggaran-uuid' },
                    nominal: { type: 'number', example: 450000 },
                    strukUrl: { type: 'string', example: '/uploads/struk.png' },
                    ocrData: { type: 'object', example: { merchant: 'Gramedia Merdeka', tanggal: '2026-05-18' } }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Reimbursement submitted' }
          }
        }
      },
      '/api/reimbursements/{id}/approve': {
        post: {
          tags: ['Reimbursements'],
          summary: 'Process validation / Approval',
          description: 'Level 1: Project Manager approves status SUBMITTED. Level 2: Keuangan approves status APPROVED_BY_PM. For Keuangan approval, debit and credit account numbers must be supplied for automatic journal generation.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['action'],
                  properties: {
                    action: { type: 'string', enum: ['APPROVE', 'REJECT'], example: 'APPROVE' },
                    catatan: { type: 'string', example: 'Dokumen lengkap, disetujui.' },
                    noAkunDebit: { type: 'string', example: '50001', description: 'Required for Keuangan only' },
                    noAkunKredit: { type: 'string', example: '10000', description: 'Required for Keuangan only' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Approval processed successfully' }
          }
        }
      },
      '/api/reimbursements/{id}/cancel': {
        post: {
          tags: ['Reimbursements'],
          summary: 'Cancel a pending submission',
          description: 'Karyawan cancels their own reimbursement while it is still SUBMITTED (waiting for PM). Permanently deletes the reimbursement record.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Reimbursement successfully cancelled and removed' },
            400: { description: 'Reimbursement is not in SUBMITTED status' },
            403: { description: 'Forbidden: not the owner of this submission' }
          }
        }
      },
      '/api/ocr': {
        post: {
          tags: ['Receipt OCR'],
          summary: 'Simulate AI OCR extraction',
          description: 'Accepts a receipt image and extracts merchant, date, and amount without manual inputs (FR07).',
          responses: {
            200: { description: 'OCR parsed data' }
          }
        }
      },
      '/api/dashboard': {
        get: {
          tags: ['Dashboards'],
          summary: 'Get dashboard summaries',
          description: 'Role-based statistics. Completely excludes Service Score.',
          responses: {
            200: { description: 'Dashboard stats' }
          }
        }
      },
      '/api/laporan': {
        get: {
          tags: ['Financial Reports'],
          summary: 'Generate financial reports',
          description: 'Retrieves General Ledger, Balance Sheet, or Income Statement per project. Supports csv exports.',
          parameters: [
            { name: 'type', in: 'query', required: true, schema: { type: 'string', enum: ['buku-besar', 'neraca', 'laba-rugi'] } },
            { name: 'proyekId', in: 'query', schema: { type: 'string' } },
            { name: 'export', in: 'query', schema: { type: 'string', enum: ['json', 'csv'] } }
          ],
          responses: {
            200: { description: 'Report generated successfully' }
          }
        }
      },
      '/api/audit-trail': {
        get: {
          tags: ['Audit Logs'],
          summary: 'Fetch system audit trail logs',
          description: 'Restricted: Tim Keuangan or Direktur only.',
          responses: {
            200: { description: 'List of audit trails' }
          }
        }
      },
      '/api/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Get notifications list',
          responses: {
            200: { description: 'List of notifications' }
          }
        },
        put: {
          tags: ['Notifications'],
          summary: 'Mark notification(s) as read',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'Optional ID. If left blank, marks all as read.' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Status updated' }
          }
        }
      },
      '/api/smart-chat': {
        post: {
          tags: ['Smart Chat (LLM)'],
          summary: 'Ask natural language question',
          description: 'Queries database directly for sisa budget, largest expense, pending tasks, journals, and CoA.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string', example: 'Berapa sisa budget proyek saat ini?' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Chat response' }
          }
        }
      }
    }
  };

  return NextResponse.json(spec);
}
