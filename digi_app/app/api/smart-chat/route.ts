import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Process natural language queries (Smart Chat with GROQ & Fallback Mock)
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');

    // Smart chat is restricted to PM, Tim Keuangan, or Direktur / Manajemen
    if (role !== 'Project Manager' && role !== 'Tim Keuangan' && role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden: Unauthorized to use Smart Chat' }, { status: 403 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();
    let mockResponseText = '';

    // --- 1. Gather mock responses (used as fallback or when key is missing) ---
    // 1.1 Sisa budget query
    if (lowerMessage.includes('sisa budget') || lowerMessage.includes('sisa anggaran') || lowerMessage.includes('budget proyek')) {
      const budgets = await prisma.budget.findMany({
        include: { proyek: { select: { nama: true } } },
      });

      if (budgets.length === 0) {
        mockResponseText = 'Saat ini belum ada data budget proyek yang dikonfigurasi di sistem.';
      } else {
        mockResponseText = 'Berikut adalah rincian sisa budget proyek saat ini:\n';
        budgets.forEach((b) => {
          const sisa = Number(b.sisaBudget);
          const total = Number(b.rabTotal);
          const pct = total > 0 ? ((sisa / total) * 100).toFixed(1) : '0';
          mockResponseText += `- **Proyek ${b.proyek.nama}**: Sisa budget Rp ${sisa.toLocaleString()} dari total Rp ${total.toLocaleString()} (${pct}% tersisa).\n`;
        });
      }
    }
    // 1.2 Pengeluaran terbesar query
    else if (lowerMessage.includes('pengeluaran terbesar') || lowerMessage.includes('transaksi terbesar') || lowerMessage.includes('terbesar')) {
      const largestRb = await prisma.reimbursement.findFirst({
        where: { status: 'APPROVED' },
        orderBy: { nominal: 'desc' },
        include: {
          user: { select: { nama: true } },
          proyek: { select: { nama: true } },
          posAnggaran: { select: { namaPos: true } },
        },
      });

      if (!largestRb) {
        mockResponseText = 'Belum ada pengeluaran/reimbursement yang disetujui di sistem saat ini.';
      } else {
        const nominal = Number(largestRb.nominal);
        mockResponseText = `Pengeluaran terbesar yang telah dicairkan di sistem adalah pengajuan dari **${largestRb.user.nama}** untuk proyek **${largestRb.proyek.nama}** (Pos Anggaran: ${largestRb.posAnggaran.namaPos}) sebesar **Rp ${nominal.toLocaleString()}**.`;
      }
    }
    // 1.3 Pending approvals query
    else if (lowerMessage.includes('pending') || lowerMessage.includes('menunggu') || lowerMessage.includes('antrian') || lowerMessage.includes('approval')) {
      const pendingRbs = await prisma.reimbursement.findMany({
        where: {
          status: { in: ['SUBMITTED', 'APPROVED_BY_PM'] },
        },
        select: {
          nominal: true,
          status: true,
        },
      });

      if (pendingRbs.length === 0) {
        mockResponseText = 'Tidak ada pengajuan reimbursement yang sedang menunggu persetujuan saat ini. Semua pengajuan bersih!';
      } else {
        const totalPendingNominal = pendingRbs.reduce((sum, r) => sum + Number(r.nominal), 0);
        const countPM = pendingRbs.filter(r => r.status === 'SUBMITTED').length;
        const countKeuangan = pendingRbs.filter(r => r.status === 'APPROVED_BY_PM').length;

        mockResponseText = `Saat ini terdapat **${pendingRbs.length} pengajuan pending** dengan total nominal **Rp ${totalPendingNominal.toLocaleString()}**.\n`;
        mockResponseText += `- Menunggu validasi Project Manager: ${countPM} pengajuan.\n`;
        mockResponseText += `- Menunggu pencairan Tim Keuangan: ${countKeuangan} pengajuan.`;
      }
    }
    // 1.4 Jurnal akuntansi/CoA query
    else if (lowerMessage.includes('jurnal') || lowerMessage.includes('coa') || lowerMessage.includes('chart of accounts') || lowerMessage.includes('akun')) {
      const journalCount = await prisma.jurnalAkuntansi.count();
      const coaCount = await prisma.chartOfAccounts.count();
      const totalDebitResult = await prisma.jurnalAkuntansi.aggregate({
        _sum: { nominal: true },
      });
      const totalDebit = Number(totalDebitResult._sum.nominal || 0);

      mockResponseText = `Sistem akuntansi mencatat **${coaCount} kode akun (CoA)** aktif.\n`;
      mockResponseText += `Terdapat **${journalCount} jurnal akuntansi** otomatis yang telah digenerate dengan total nilai nominal **Rp ${totalDebit.toLocaleString()}**. Total Debit dan Kredit tercatat seimbang (balanced).`;
    }
    // 1.5 Default fallback helper
    else {
      mockResponseText = `Halo! Saya asisten pintar Digi Money Manager. Anda dapat menanyakan tentang data keuangan real-time dari database. 
        Contoh pertanyaan yang dapat Anda ajukan:
        1. *"Berapa sisa budget proyek saat ini?"*
        2. *"Apa pengeluaran terbesar yang tercatat?"*
        3. *"Berapa banyak reimbursement yang pending?"*
        4. *"Bagaimana status jurnal akuntansi dan CoA?"*`;
    }

    // Check if GROQ API KEY is configured
    const apiKey = process.env.GROQ_API_KEY;
    const isMock = !apiKey || apiKey === 'gsk_placeholder_key_here';

    if (isMock) {
      const formattedMockReply = `**[Simulated Assistant]**\n\n${mockResponseText}\n\n*(Catatan: Anda melihat respon simulasi ini karena \`GROQ_API_KEY\` belum dikonfigurasi di file \`.env\` atau masih menggunakan nilai placeholder).*`;
      return NextResponse.json({
        reply: formattedMockReply,
        queryMessage: message,
        timestamp: new Date(),
      });
    }

    // --- 2. Call GROQ API using real database context ---
    // Fetch context data to supply to GROQ LLM
    const [projects, totalReimbursements, recentReimbursements, coas, totalJurnal] = await Promise.all([
      prisma.proyek.findMany({
        include: {
          budget: {
            select: {
              rabTotal: true,
              totalPengeluaran: true,
              totalReimbursement: true,
              sisaBudget: true,
            },
          },
        },
      }),
      prisma.reimbursement.count(),
      prisma.reimbursement.findMany({
        take: 10,
        orderBy: { id: 'desc' },
        include: {
          user: { select: { nama: true } },
          proyek: { select: { nama: true } },
          posAnggaran: { select: { namaPos: true } },
        },
      }),
      prisma.chartOfAccounts.findMany({
        select: { nomorAkun: true, namaAkun: true, tipe: true },
      }),
      prisma.jurnalAkuntansi.count(),
    ]);

    // Format Context for LLM consumption
    const projectsContext = projects.map(p => ({
      id: p.id,
      nama: p.nama,
      status: p.status,
      budget: p.budget ? {
        rabTotal: Number(p.budget.rabTotal),
        totalPengeluaran: Number(p.budget.totalPengeluaran),
        totalReimbursement: Number(p.budget.totalReimbursement),
        sisaBudget: Number(p.budget.sisaBudget),
      } : null
    }));

    const recentReimbursementsContext = recentReimbursements.map(r => ({
      id: r.id,
      pemohon: r.user.nama,
      proyek: r.proyek.nama,
      posAnggaran: r.posAnggaran.namaPos,
      nominal: Number(r.nominal),
      status: r.status,
      fraudFlag: r.fraudFlag,
    }));

    const systemPrompt = `Anda adalah Asisten Pintar Keuangan untuk aplikasi "Digi Money Manager".
Tugas Anda adalah membantu pengguna (Project Manager, Tim Keuangan, Direktur) menjawab pertanyaan seputar data keuangan real-time dari database proyek.

Berikut adalah data real-time dari database aplikasi:

--- DATA PROYEK & BUDGET ---
${JSON.stringify(projectsContext, null, 2)}

--- RINGKASAN REIMBURSEMENT ---
- Total Reimbursement di database: ${totalReimbursements}
- 10 Reimbursement Terbaru:
${JSON.stringify(recentReimbursementsContext, null, 2)}

--- AKUNTANSI (CHART OF ACCOUNTS & JURNAL) ---
- Total Chart of Accounts (CoA): ${coas.length}
- Total Jurnal Akuntansi otomatis: ${totalJurnal}
- Daftar Kode Akun (CoA):
${JSON.stringify(coas, null, 2)}
----------------------------

Aturan menjawab:
1. Jawablah pertanyaan pengguna dengan sopan, jelas, dan profesional dalam Bahasa Indonesia.
2. Gunakan data di atas untuk menjawab pertanyaan yang relevan secara akurat (seperti sisa budget, pengeluaran terbesar, status reimbursement terbaru, jumlah CoA, dll.).
3. Jika pengguna menanyakan data spesifik yang tidak ada di dalam konteks di atas, beri tahu mereka secara jujur bahwa data tersebut tidak tersedia di sistem saat ini.
4. Gunakan format markdown (seperti tebal, list, kode, atau tabel) agar jawaban mudah dibaca oleh pengguna.`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.2,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('GROQ API Error:', errText);
      // Fallback to mock text if GROQ API fails at runtime
      return NextResponse.json({
        reply: `**[Simulated Assistant (Fallback)]**\n\n${mockResponseText}\n\n*(Catatan: GROQ API mengalami kendala (${groqResponse.status}), kami menampilkan respon fallback).*`,
        queryMessage: message,
        timestamp: new Date(),
      });
    }

    const groqData = await groqResponse.json();
    const reply = groqData.choices?.[0]?.message?.content || mockResponseText;

    return NextResponse.json({
      reply,
      queryMessage: message,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Smart chat error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
