import { NextResponse, NextRequest } from 'next/server';
import { getAIChatContext } from '@/lib/temp-data-repo';

// POST: Process natural language queries (Smart Chat with GROQ & Fallback Mock)
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');

    // Smart chat is restricted to PM, Tim Keuangan, or Direktur / Manajemen
    if (role !== 'Project Manager' && role !== 'Tim Keuangan' && role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden: Unauthorized to use Smart Chat' }, { status: 403 });
    }

    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();
    let mockResponseText = '';

    // --- 1. Gather context data from Temporary Data Repository (with TTL Cache) ---
    const context = await getAIChatContext();

    // --- 2. Process query in mock response mode (used as fallback or when key is missing) ---
    // 2.1 Project Margin query (Concise 3 highest margins)
    if (lowerMessage.includes('margin') || lowerMessage.includes('profit') || lowerMessage.includes('untung')) {
      const sorted = [...context.projectsContext]
        .filter(p => p.budget)
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 3);

      if (sorted.length === 0) {
        mockResponseText = 'Belum ada data budget proyek untuk menghitung margin.';
      } else {
        mockResponseText = '3 proyek dengan margin tertinggi:\n' +
          sorted.map((p, idx) => `${idx + 1}. **${p.nama}**: ${p.margin}%`).join('\n');
      }
    }
    // 2.2 Sisa budget query
    else if (lowerMessage.includes('sisa budget') || lowerMessage.includes('sisa anggaran') || lowerMessage.includes('budget proyek')) {
      const activeProjects = context.projectsContext.filter(p => p.budget);

      if (activeProjects.length === 0) {
        mockResponseText = 'Belum ada data budget proyek.';
      } else {
        mockResponseText = 'Sisa budget proyek saat ini:\n' +
          activeProjects.map((p) => {
            const sisa = p.budget.sisaBudget;
            const total = p.budget.rabTotal;
            const pct = total > 0 ? ((sisa / total) * 100).toFixed(1) : '0';
            return `- **${p.nama}**: Sisa Rp ${sisa.toLocaleString()} / Rp ${total.toLocaleString()} (${pct}% sisa).`;
          }).join('\n');
      }
    }
    // 2.3 Pengeluaran terbesar query
    else if (lowerMessage.includes('pengeluaran terbesar') || lowerMessage.includes('transaksi terbesar') || lowerMessage.includes('terbesar')) {
      if (!context.largestApproved) {
        mockResponseText = 'Belum ada pengeluaran disetujui.';
      } else {
        const { nominal, pemohon, proyek, posAnggaran } = context.largestApproved;
        mockResponseText = `Pengeluaran terbesar yang dicairkan: **Rp ${nominal.toLocaleString()}** oleh **${pemohon}** untuk proyek **${proyek}** (Pos: ${posAnggaran}).`;
      }
    }
    // 2.4 Pending approvals query
    else if (lowerMessage.includes('pending') || lowerMessage.includes('menunggu') || lowerMessage.includes('antrian') || lowerMessage.includes('approval')) {
      const { count, totalNominal, countPM, countKeuangan } = context.pendingStats;

      if (count === 0) {
        mockResponseText = 'Tidak ada pengajuan pending.';
      } else {
        mockResponseText = `Terdapat **${count} pengajuan pending** (Total: **Rp ${totalNominal.toLocaleString()}**):\n` +
          `- Menunggu PM: ${countPM} pengajuan.\n` +
          `- Menunggu Keuangan: ${countKeuangan} pengajuan.`;
      }
    }
    // 2.5 Jurnal akuntansi/CoA query
    else if (lowerMessage.includes('jurnal') || lowerMessage.includes('coa') || lowerMessage.includes('chart of accounts') || lowerMessage.includes('akun')) {
      const coaCount = context.coas.length;
      const journalCount = context.totalJurnal;

      mockResponseText = `Sistem mencatat **${coaCount} CoA** aktif dan **${journalCount} jurnal** otomatis.`;
    }
    // 2.6 Default fallback helper
    else {
      mockResponseText = `Halo! Saya asisten finansial Anda. Ajukan pertanyaan ringkas seperti:\n` +
        `- *"Tampilkan 3 proyek dengan margin tertinggi"* (Margin query)\n` +
        `- *"Berapa sisa budget proyek?"*\n` +
        `- *"Apa pengeluaran terbesar?"*\n` +
        `- *"Berapa banyak reimbursement pending?"*\n` +
        `- *"Bagaimana status CoA dan jurnal?"*`;
    }

    // Check if GROQ API KEY is configured
    const apiKey = process.env.GROQ_API_KEY;
    const isMock = !apiKey || apiKey === 'gsk_placeholder_key_here';

    if (isMock) {
      const formattedMockReply = `**[Simulated Assistant]**\n\n${mockResponseText}\n\n*(Catatan: Anda melihat respon simulasi ini karena \`GROQ_API_KEY\` belum dikonfigurasi).*`;
      return NextResponse.json({
        reply: formattedMockReply,
        queryMessage: message,
        timestamp: new Date(),
      });
    }

    // --- 3. Call GROQ API using temporary cached context ---
    const systemPrompt = `Anda adalah Asisten Pintar Keuangan untuk aplikasi "Digi Money Manager".
Tugas Anda adalah membantu pengguna (Project Manager, Tim Keuangan, Direktur) menjawab pertanyaan seputar data keuangan real-time dari database proyek secara ringkas dan tepat sasaran.

Berikut adalah data real-time dari database aplikasi (diambil dari repositori data):

--- DATA PROYEK & BUDGET ---
${JSON.stringify(context.projectsContext, null, 2)}

--- RINGKASAN REIMBURSEMENT ---
- Total Reimbursement di database: ${context.totalReimbursements}
- Statistik Pending: ${JSON.stringify(context.pendingStats, null, 2)}
- Pengeluaran Terbesar: ${JSON.stringify(context.largestApproved, null, 2)}
- 10 Reimbursement Terbaru:
${JSON.stringify(context.recentReimbursementsContext, null, 2)}

--- AKUNTANSI (CHART OF ACCOUNTS & JURNAL) ---
- Total Chart of Accounts (CoA): ${context.coas.length}
- Total Jurnal Akuntansi otomatis: ${context.totalJurnal}
- Daftar Kode Akun (CoA):
${JSON.stringify(context.coas, null, 2)}
----------------------------

Aturan menjawab:
1. Jawablah pertanyaan pengguna dengan sopan, jelas, dan profesional dalam Bahasa Indonesia.
2. Gunakan data di atas untuk menjawab pertanyaan secara akurat (seperti sisa budget, proyek margin tertinggi, pengeluaran terbesar, dll.).
3. Jika data tidak tersedia di dalam konteks di atas, beri tahu secara jujur bahwa data tersebut tidak tersedia.
4. Gunakan format markdown (list, tabel, atau tebal) agar mudah dibaca.
5. Jawablah secara langsung, singkat, dan tepat pada inti data yang diminta. Hindari kalimat pembuka, basa-basi, atau penutup yang panjang lebar (jangan bertele-tele). Langsung sajikan informasi atau data inti yang diminta (misal: "3 proyek dengan margin tertinggi adalah: ...").`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: (() => {
          const apiMessages: any[] = [
            { role: 'system', content: systemPrompt }
          ];
          if (Array.isArray(history)) {
            const limitedHistory = history.slice(-10);
            limitedHistory.forEach((msg: any) => {
              if (msg.role === 'user' || msg.role === 'assistant') {
                apiMessages.push({ role: msg.role, content: msg.content });
              }
            });
          }
          apiMessages.push({ role: 'user', content: message });
          return apiMessages;
        })(),
        temperature: 0.2,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('GROQ API Error:', errText);
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
