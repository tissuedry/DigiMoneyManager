import { NextResponse, NextRequest } from 'next/server';
import { getAIChatContext, AIChatScope } from '@/lib/temp-data-repo';

const KNOWN_ROLES = ['Karyawan', 'Project Manager', 'Tim Keuangan', 'Direktur / Manajemen'];

// POST: Process natural language queries (Smart Chat with GROQ & Fallback Mock)
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role') || '';
    const userIdHeader = req.headers.get('x-user-id');
    const proyekIdHeader = req.headers.get('x-user-proyek-id');

    // Smart Chat kini tersedia untuk semua role — data yang dilihat dibatasi sesuai scope masing-masing
    if (!KNOWN_ROLES.includes(role) || !userIdHeader) {
      return NextResponse.json({ message: 'Forbidden: Unauthorized to use Smart Chat' }, { status: 403 });
    }

    const scope: AIChatScope = {
      role,
      userId: parseInt(userIdHeader, 10),
      proyekId: proyekIdHeader ? parseInt(proyekIdHeader, 10) : null,
    };

    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();
    let mockResponseText = '';

    // --- 1. Gather context data from Temporary Data Repository (with TTL Cache, scoped per role) ---
    const context = await getAIChatContext(scope);

    // --- 1b. Deteksi maksud pesan sekali di awal — dipakai ULANG oleh mode simulasi (di bawah) DAN oleh
    // pembangun prompt GROQ (di bawah), supaya hanya bagian data yang relevan yang dikirim ke AI.
    // Ini penting untuk menghemat token: sebelumnya SELURUH data (semua proyek, semua pos anggaran,
    // semua tim, semua pengajuan anggaran, CoA) selalu dikirim di setiap pesan, walau pertanyaannya
    // cuma soal satu hal kecil. Sekarang hanya bagian yang relevan dengan maksud pesan yang disertakan.
    const wantsMargin = lowerMessage.includes('margin') || lowerMessage.includes('profit') || lowerMessage.includes('untung');
    const wantsBudget = lowerMessage.includes('sisa budget') || lowerMessage.includes('sisa anggaran') || lowerMessage.includes('budget proyek');
    const wantsBulanIni = lowerMessage.includes('bulan ini') || lowerMessage.includes('bulan berjalan');
    const wantsRealisasi = lowerMessage.includes('realisasi');
    const wantsTim = /\btim\b/.test(lowerMessage) || lowerMessage.includes('anggota') || (lowerMessage.includes('karyawan') && (lowerMessage.includes('siapa') || lowerMessage.includes('daftar')));
    const wantsPengajuanAnggaran = lowerMessage.includes('pengajuan anggaran') || lowerMessage.includes('usulan anggaran') || lowerMessage.includes('usulan pos') || lowerMessage.includes('ajukan pos');
    const wantsTerbesar = lowerMessage.includes('pengeluaran terbesar') || lowerMessage.includes('transaksi terbesar') || lowerMessage.includes('terbesar');
    const wantsPending = lowerMessage.includes('pending') || lowerMessage.includes('menunggu') || lowerMessage.includes('antrian') || lowerMessage.includes('approval');
    const wantsJurnalCoa = lowerMessage.includes('jurnal') || lowerMessage.includes('coa') || lowerMessage.includes('chart of accounts') || lowerMessage.includes('akun');
    // Kalau tidak ada kata kunci spesifik yang cocok, anggap ini pencarian umum (mis. "gaji siapa paling tinggi",
    // "berapa alokasi sewa alat") — di kasus ini kirim data transaksi + pos anggaran + tim supaya AI tetap bisa
    // mencari lintas nama/kategori seperti sebelumnya, karena kita tidak tahu topik spesifiknya apa.
    const isGenericFallback = !(wantsMargin || wantsBudget || wantsBulanIni || wantsRealisasi || wantsTim || wantsPengajuanAnggaran || wantsTerbesar || wantsPending || wantsJurnalCoa);

    // --- 2. Process query in mock response mode (used as fallback or when key is missing) ---
    // 2.1 Project Margin query (Concise 3 highest margins)
    if (wantsMargin) {
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
    else if (wantsBudget) {
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
    // 2.2b Total reimbursement/realisasi BULAN INI — pakai agregat DB langsung (bukan nyari manual di list "30 terbaru")
    // supaya totalnya selalu akurat walau transaksi bulan ini lebih dari 30 baris.
    else if (wantsBulanIni) {
      const { count, totalNominal } = context.thisMonthStats;
      if (count === 0) {
        mockResponseText = 'Belum ada reimbursement/realisasi anggaran yang diajukan bulan ini dalam lingkup akses Anda.';
      } else {
        mockResponseText = `Bulan ini terdapat **${count} pengajuan** (reimbursement + realisasi anggaran) dengan total **Rp ${totalNominal.toLocaleString()}** dalam lingkup akses Anda.`;
      }
    }
    // 2.3 Realisasi Anggaran query (pengajuan yang diajukan langsung oleh PM, berbeda dari reimbursement karyawan)
    else if (wantsRealisasi) {
      const realisasiList = context.recentReimbursementsContext.filter((r: any) => r.tipe === 'Realisasi Anggaran');

      if (realisasiList.length === 0) {
        mockResponseText = 'Belum ada data Realisasi Anggaran dalam lingkup akses Anda.';
      } else {
        mockResponseText = 'Realisasi Anggaran terbaru:\n' +
          realisasiList.map((r: any) => `- **${r.proyek}**: Rp ${r.nominal.toLocaleString()} oleh ${r.pemohon} (Pos: ${r.kategoriAnggaran}, Status: ${r.status}).`).join('\n');
      }
    }
    // 2.4 Tim/anggota proyek query (khusus Project Manager & Direktur — sesuai halaman Kelola Proyek/Registrasi Anggota)
    // Catatan: pakai \b (word boundary) supaya "tim" tidak salah cocok dengan substring seperti "estimasi"/"sistem".
    else if (wantsTim) {
      if (role !== 'Project Manager' && role !== 'Direktur / Manajemen') {
        mockResponseText = 'Data susunan tim/anggota proyek hanya dapat diakses oleh Project Manager atau Direktur.';
      } else if (context.teamContext.length === 0) {
        mockResponseText = 'Belum ada data tim/anggota dalam lingkup akses Anda.';
      } else {
        const byProyek = new Map<string, string[]>();
        for (const t of context.teamContext) {
          const list = byProyek.get(t.proyek) || [];
          list.push(`${t.nama} (${t.role}${t.divisi ? `, ${t.divisi}` : ''})`);
          byProyek.set(t.proyek, list);
        }
        mockResponseText = 'Susunan tim per proyek:\n' +
          Array.from(byProyek.entries()).map(([proyek, members]) => `- **${proyek}**: ${members.join(', ')}`).join('\n');
      }
    }
    // 2.5 Pengajuan Anggaran query (usulan ubah struktur pos anggaran oleh PM, direview Direktur — beda dari Realisasi Anggaran/pencairan dana)
    else if (wantsPengajuanAnggaran) {
      if (role !== 'Project Manager' && role !== 'Direktur / Manajemen') {
        mockResponseText = 'Data Pengajuan Anggaran (usulan ubah pos anggaran) hanya dapat diakses oleh Project Manager atau Direktur.';
      } else if (context.pengajuanAnggaranContext.length === 0) {
        mockResponseText = 'Belum ada Pengajuan Anggaran dalam lingkup akses Anda.';
      } else {
        mockResponseText = 'Pengajuan Anggaran terbaru:\n' +
          context.pengajuanAnggaranContext.slice(0, 5).map((pa: any) =>
            `- **${pa.judul}** — proyek ${pa.proyek}, diajukan oleh ${pa.pengaju} (Status: ${pa.status}). Isi: ${pa.items.map((i: any) => `${i.aksi} ${i.nama || ''}`).join(', ')}.`
          ).join('\n');
      }
    }
    // 2.6 Pengeluaran terbesar query
    else if (wantsTerbesar) {
      if (!context.largestApproved) {
        mockResponseText = 'Belum ada pengeluaran disetujui.';
      } else {
        const { tipe, nominal, pemohon, proyek, kategoriAnggaran } = context.largestApproved;
        mockResponseText = `Pengeluaran terbesar yang dicairkan (${tipe}): **Rp ${nominal.toLocaleString()}** oleh **${pemohon}** untuk proyek **${proyek}** (Pos: ${kategoriAnggaran}).`;
      }
    }
    // 2.7 Pending approvals query
    else if (wantsPending) {
      const { count, totalNominal, countPM, countKeuangan, countRealisasiAnggaran, countReimbursementBiasa } = context.pendingStats;

      if (count === 0) {
        mockResponseText = 'Tidak ada pengajuan pending.';
      } else {
        mockResponseText = `Terdapat **${count} pengajuan pending** (Total: **Rp ${totalNominal.toLocaleString()}**):\n` +
          `- Menunggu PM: ${countPM} pengajuan.\n` +
          `- Menunggu Keuangan: ${countKeuangan} pengajuan.\n` +
          `- Realisasi Anggaran: ${countRealisasiAnggaran} pengajuan.\n` +
          `- Reimbursement biasa: ${countReimbursementBiasa} pengajuan.`;
      }
    }
    // 2.8 Jurnal akuntansi/CoA query (khusus Tim Keuangan & Direktur)
    else if (wantsJurnalCoa) {
      if (role !== 'Tim Keuangan' && role !== 'Direktur / Manajemen') {
        mockResponseText = 'Data CoA dan jurnal akuntansi hanya dapat diakses oleh Tim Keuangan atau Direktur.';
      } else {
        const coaCount = context.coas.length;
        const journalCount = context.totalJurnal;
        mockResponseText = `Sistem mencatat **${coaCount} CoA** aktif dan **${journalCount} jurnal** otomatis.`;
      }
    }
    // 2.9 Generic search: cocokkan kata kunci pengguna terhadap (a) nama/kategori setiap pengajuan transaksi,
    // dan (b) rencana pos anggaran per proyek — termasuk pos yang BELUM PERNAH ada transaksinya.
    // Menutupi kasus seperti "gaji siapa yang paling tinggi", "berapa alokasi sewa alat", dll.
    else {
      const STOPWORDS = new Set([
        'yang', 'yg', 'apa', 'apakah', 'siapa', 'berapa', 'dengan', 'untuk', 'dari', 'pada',
        'ada', 'ini', 'itu', 'dan', 'atau', 'di', 'ke', 'saya', 'anda', 'tolong', 'coba', 'bisa',
        'mohon', 'info', 'informasi', 'data', 'proyek', 'paling', 'tinggi', 'tertinggi', 'terbesar',
        'terkecil', 'rendah', 'jumlah', 'total', 'semua', 'tampilkan', 'lihat', 'cek', 'alokasi',
      ]);
      const keywords = lowerMessage.split(/\s+/).filter((w) => w.length >= 3 && !STOPWORDS.has(w));

      const transaksiMatches = keywords.length === 0 ? [] : context.recentReimbursementsContext
        .filter((r: any) => keywords.some((k) =>
          r.nama?.toLowerCase().includes(k) || r.kategoriAnggaran?.toLowerCase().includes(k)
        ))
        .sort((a: any, b: any) => b.nominal - a.nominal);

      const posMatches = keywords.length === 0 ? [] : context.posAnggaranContext
        .filter((pos: any) => keywords.some((k) =>
          pos.pos?.toLowerCase().includes(k) || pos.subKategori?.toLowerCase().includes(k) || pos.kategoriUtama?.toLowerCase().includes(k)
        ))
        .sort((a: any, b: any) => b.alokasi - a.alokasi);

      const teamMatches = keywords.length === 0 ? [] : context.teamContext
        .filter((t: any) => keywords.some((k) => t.nama?.toLowerCase().includes(k) || t.divisi?.toLowerCase().includes(k)));

      if (transaksiMatches.length > 0 || posMatches.length > 0 || teamMatches.length > 0) {
        const parts: string[] = [];
        if (transaksiMatches.length > 0) {
          parts.push('Transaksi terkait (diurutkan dari nominal tertinggi):\n' +
            transaksiMatches.slice(0, 5).map((r: any) =>
              `- **${r.nama || r.kategoriAnggaran}** (${r.tipe}): Rp ${r.nominal.toLocaleString()} — proyek ${r.proyek}, diajukan oleh ${r.pemohon} (Status: ${r.status}).`
            ).join('\n'));
        }
        if (posMatches.length > 0) {
          parts.push('Alokasi pos anggaran terkait (dari rencana budget):\n' +
            posMatches.slice(0, 5).map((pos: any) =>
              `- **${pos.pos}** (${pos.kategoriUtama} > ${pos.subKategori}) — proyek ${pos.proyek}: Alokasi Rp ${pos.alokasi.toLocaleString()}, Realisasi Rp ${pos.realisasi.toLocaleString()} (Sisa Rp ${pos.sisaAlokasi.toLocaleString()}).`
            ).join('\n'));
        }
        if (teamMatches.length > 0) {
          parts.push('Anggota tim terkait:\n' +
            teamMatches.slice(0, 5).map((t: any) => `- **${t.nama}** — ${t.role}${t.divisi ? ` (${t.divisi})` : ''}, proyek ${t.proyek}.`).join('\n'));
        }
        mockResponseText = parts.join('\n\n');
      } else {
        mockResponseText = `Halo! Saya asisten finansial Anda. Ajukan pertanyaan ringkas seperti:\n` +
          `- *"Tampilkan 3 proyek dengan margin tertinggi"* (Margin query)\n` +
          `- *"Berapa sisa budget proyek?"*\n` +
          `- *"Apa saja Realisasi Anggaran terbaru?"*\n` +
          `- *"Apa pengeluaran terbesar?"*\n` +
          `- *"Berapa banyak reimbursement pending?"*\n` +
          `- *"Bagaimana status CoA dan jurnal?"*`;
      }
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
    // Hanya sertakan bagian data yang relevan dengan maksud pesan (lihat flag `wants...`/`isGenericFallback`
    // di atas) supaya token yang dikirim ke GROQ tidak selalu memuat SELURUH data perusahaan di setiap pesan.
    const canSeeTeamAndProposals = role === 'Project Manager' || role === 'Direktur / Manajemen';
    const canSeeAccounting = role === 'Tim Keuangan' || role === 'Direktur / Manajemen';

    const posAnggaranSection = (wantsBudget || isGenericFallback)
      ? `
--- RENCANA POS ANGGARAN (alokasi per kategori per proyek, TERMASUK pos yang belum pernah ada transaksinya) ---
${JSON.stringify(context.posAnggaranContext, null, 2)}`
      : '';

    const includeTransactions = wantsRealisasi || wantsTerbesar || wantsPending || wantsBulanIni || isGenericFallback;
    const transactionsSection = includeTransactions
      ? `- Daftar 30 Reimbursement/Realisasi Anggaran Terbaru dalam lingkup ini (masing-masing punya \`createdAt\` untuk filter tanggal manual jika pengguna tanya periode selain "bulan ini", misal "minggu ini" atau tanggal tertentu):
${JSON.stringify(context.recentReimbursementsContext, null, 2)}`
      : '- (Daftar detail transaksi tidak disertakan kali ini karena dianggap tidak relevan dengan pertanyaan — statistik ringkas di atas sudah cukup untuk menjawabnya.)';

    const accountingSection = (wantsJurnalCoa && canSeeAccounting)
      ? `
--- AKUNTANSI (CHART OF ACCOUNTS & JURNAL) ---
- Total Chart of Accounts (CoA): ${context.coas.length}
- Total Jurnal Akuntansi otomatis: ${context.totalJurnal}
- Daftar Kode Akun (CoA):
${JSON.stringify(context.coas, null, 2)}
----------------------------`
      : '';

    const teamSection = ((wantsTim || isGenericFallback) && canSeeTeamAndProposals)
      ? `
--- SUSUNAN TIM PROYEK (siapa Project Manager / Karyawan di proyek mana, dan divisinya) ---
${JSON.stringify(context.teamContext, null, 2)}
----------------------------`
      : '';

    const proposalSection = ((wantsPengajuanAnggaran || isGenericFallback) && canSeeTeamAndProposals)
      ? `
--- PENGAJUAN ANGGARAN (usulan ubah struktur pos anggaran: tambah/ubah/hapus pos — diajukan PM, direview Direktur. INI BERBEDA dari Realisasi Anggaran/reimbursement di atas, yang soal pencairan dana, bukan perubahan struktur pos) ---
${JSON.stringify(context.pengajuanAnggaranContext, null, 2)}
----------------------------`
      : '';

    const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const systemPrompt = `Anda adalah Asisten Pintar Keuangan untuk aplikasi "Digi Money Manager".
Tugas Anda adalah membantu pengguna menjawab pertanyaan seputar data keuangan real-time dari database proyek secara ringkas dan tepat sasaran.

Hari ini: **${todayStr}** (gunakan ini sebagai acuan waktu "sekarang" saat pengguna bertanya soal "bulan ini", "minggu ini", "hari ini", dll).

Pengguna saat ini memiliki role: **${role}**.
Lingkup akses data (scope): ${context.scopeNote}

Catatan penting mengenai field pada data "REIMBURSEMENT" di bawah:
- \`tipe\`: bernilai **"Realisasi Anggaran"** (pengajuan pencairan dana proyek yang diajukan langsung oleh Project Manager, bukan pengeluaran pribadi karyawan) atau **"Reimbursement"** (klaim penggantian biaya pribadi yang diajukan oleh Karyawan).
- \`pemohon\`: nama user yang MENGAJUKAN/menginput pengajuan ini ke sistem (biasanya Project Manager untuk Realisasi Anggaran).
- \`nama\`: judul/keterangan bebas yang ditulis pemohon saat mengajukan, dan SERING kali berisi nama pihak/personil PENERIMA dana yang sebenarnya (contoh: pengajuan dengan \`nama\` "Gaji Damar" berarti dana ini untuk membayar personil bernama "Damar", meskipun \`pemohon\`-nya adalah PM yang mengajukan). Saat pengguna bertanya soal "gaji siapa yang paling tinggi" atau menyebut nama/item tertentu, cari kecocokan pada field \`nama\` (dan \`kategoriAnggaran\` sebagai kategori pos anggarannya, misal "Gaji Personil"), bukan pada \`pemohon\`.
- \`createdAt\`: tanggal pengajuan ini dibuat di sistem (ISO datetime). GUNAKAN field ini untuk menjawab pertanyaan bertema waktu seperti "bulan ini", "minggu ini", "hari ini", atau tanggal spesifik — hitung/filter/jumlahkan SENDIRI dari daftar transaksi berdasarkan \`createdAt\` dibandingkan dengan tanggal hari ini di atas. JANGAN bilang "tidak ada informasi bulanan" — datanya ada, tinggal difilter berdasarkan tanggal.
Jika pengguna bertanya spesifik soal "realisasi" atau "realisasi anggaran", filter dan jawab HANYA dari data yang \`tipe\`-nya "Realisasi Anggaran". Jangan campur dengan data reimbursement biasa kecuali diminta secara umum.

Jika pengguna bertanya soal alokasi/rencana anggaran untuk suatu kategori/pos tertentu (misal "berapa alokasi sewa alat"), cari di "RENCANA POS ANGGARAN" — data ini mencakup SEMUA pos yang direncanakan, termasuk yang realisasinya masih Rp 0 (belum pernah dipakai). Jangan bilang "tidak ada data" hanya karena belum ada transaksi jika posnya memang tercantum di rencana anggaran.

Catatan: untuk menghemat token, hanya bagian data yang relevan dengan pertanyaan ini yang disertakan di bawah — bukan seluruh database. Jika ada bagian yang tampak tidak disertakan padahal pengguna bertanya hal lain di pesan yang SAMA, minta mereka menanyakannya secara terpisah/lebih spesifik agar bagian itu ikut disertakan di respons berikutnya — JANGAN langsung mengklaim datanya tidak ada di sistem.

Berikut adalah data real-time dari database aplikasi, yang SUDAH dibatasi sesuai lingkup akses role pengguna di atas (diambil dari repositori data):

--- DATA PROYEK & BUDGET ---
${JSON.stringify(context.projectsContext, null, 2)}
${posAnggaranSection}

--- RINGKASAN REIMBURSEMENT ---
- Total Reimbursement dalam lingkup akses ini: ${context.totalReimbursements}
- Agregat BULAN INI (dihitung langsung dari DB, akurat, TIDAK dibatasi ke 30 baris di bawah): ${JSON.stringify(context.thisMonthStats, null, 2)}
- Statistik Pending: ${JSON.stringify(context.pendingStats, null, 2)}
- Pengeluaran Terbesar: ${JSON.stringify(context.largestApproved, null, 2)}
${transactionsSection}
${accountingSection}
${teamSection}
${proposalSection}

Aturan menjawab:
1. Jawablah pertanyaan pengguna dengan sopan, jelas, dan profesional dalam Bahasa Indonesia.
2. Gunakan data di atas untuk menjawab pertanyaan secara akurat (seperti sisa budget, proyek margin tertinggi, pengeluaran terbesar, dll.).
3. Jika data tidak tersedia di dalam konteks di atas, beri tahu secara jujur bahwa data tersebut tidak tersedia.
4. JANGAN PERNAH mengarang atau mengasumsikan data proyek lain, user lain, tim/anggota, pengajuan anggaran, atau data akuntansi di luar konteks yang diberikan di atas. Jika pengguna bertanya sesuatu di luar lingkup akses mereka (misal Karyawan bertanya data proyek lain, atau non-Keuangan bertanya jurnal/CoA, atau Karyawan/Tim Keuangan bertanya susunan tim/Pengajuan Anggaran), jawab dengan sopan bahwa data tersebut di luar lingkup akses mereka.
5. Gunakan format markdown (list, tabel, atau tebal) agar mudah dibaca.
6. Jawablah secara langsung, singkat, dan tepat pada inti data yang diminta. Hindari kalimat pembuka, basa-basi, atau penutup yang panjang lebar (jangan bertele-tele). Langsung sajikan informasi atau data inti yang diminta (misal: "3 proyek dengan margin tertinggi adalah: ...").`;

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
