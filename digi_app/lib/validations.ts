import { z } from "zod";

// Schema untuk login
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

// Schema untuk registrasi user baru
export const registerSchema = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 karakter"),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["Karyawan", "Project Manager", "Tim Keuangan", "Direktur / Manajemen"], {
    error: "Role harus salah satu dari: Karyawan, Project Manager, Tim Keuangan, Direktur / Manajemen"
  }),
  proyekId: z.union([z.number(), z.string()]).optional().nullable(),
  divisi: z.string().trim().optional().nullable(),
});
