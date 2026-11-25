// @author piercer
(() => {
  const KEY = "piercer_bug_qa_v1";
  const SEV_LABEL = { critical: "Crítico", high: "Alto", medium: "Médio", low: "Baixo" };
  const STATUS_LABEL = { open: "Aberto", fixing: "Em Correção", testing: "Testando", resolved: "Resolvido" };

  let bugs = (() => {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      return Array.isArray(r) ? r : [
        {
          id: "b1",
          title: "Timeout no webhook ao enviar payload grande",
          sev: "high",
          status: "open",
          env: "Node 24 / Produção",
          steps: "1. Enviar JSON acima de 2MB\n2. Aguardar resposta da API",
          expected: "Esperado: 200 OK. Atual: 504 Gateway Timeout.",
          img: "",
          createdAt: new Date().toISOString(),
        },
      ];
    } catch { return []; }
  })();

  let draftImg = "";
  const els = {
    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    sevFilter: document.getElementById("sevFilter"),
    bugList: document.getElementById("bugList"),
    btnNewBug: document.getElementById("btnNewBug"),
    btnExportJson: document.getElementById("btnExportJson"),
    bugModal: document.getElementById("bugModal"),
    btnClose: document.getElementById("btnClose"),
    btnCancel: document.getElementById("btnCancel"),
    btnDelete: document.getElementById("btnDelete"),
    bugForm: document.getElementById("bugForm"),
    bId: document.getElementById("bId"),
    bTitle: document.getElementById("bTitle"),
    bSev: document.getElementById("bSev"),
    bStatus: document.getElementById("bStatus"),
    bEnv: document.getElementById("bEnv"),
    bSteps: document.getElementById("bSteps"),
    bExpected: document.getElementById("bExpected"),
    bImg: document.getElementById("bImg"),
    bImgPreview: document.getElementById("bImgPreview"),
  };

  function save() { localStorage.setItem(KEY, JSON.stringify(bugs)); }
  function esc(s) { return String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function toMarkdown(b) {
    return [
      `## [BUG] ${b.title}`,
      `- **Severidade:** ${SEV_LABEL[b.sev] || b.sev}`,
      `- **Status:** ${STATUS_LABEL[b.status] || b.status}`,
      `- **Ambiente:** ${b.env || "Não informado"}`,
      "",
      "### Passos para Reproduzir",
      b.steps || "-",
      "",
      "### Esperado vs. Atual",
      b.expected || "-",
    ].join("\n");
  }

  function render() {
    const q = els.searchInput.value.trim().toLowerCase();
    const st = els.statusFilter.value;
    const sv = els.sevFilter.value;

    const list = bugs.filter((b) => {
      if (st !== "all" && b.status !== st) return false;
      if (sv !== "all" && b.sev !== sv) return false;
      if (q && !`${b.title} ${b.env} ${b.steps}`.toLowerCase().includes(q)) return false;
      return true;
    });

    els.bugList.innerHTML = "";
    if (!list.length) {
      els.bugList.innerHTML = `<div class="card subtitle">Nenhum bug encontrado neste filtro.</div>`;
      return;
    }

    list.forEach((b) => {
      const card = document.createElement("article");
      card.className = "card bug-card";
      card.innerHTML = `
        <div class="bug-head">
          <div>
            <div class="bug-title">${esc(b.title)}</div>
            <div class="pills">
              <span class="pill sev-${esc(b.sev)}">${SEV_LABEL[b.sev] || b.sev}</span>
              <span class="pill">${STATUS_LABEL[b.status] || b.status}</span>
              ${b.env ? `<span class="pill">${esc(b.env)}</span>` : ""}
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-md">Copiar Markdown</button>
            <button type="button" class="btn btn-primary btn-edit">Editar</button>
          </div>
        </div>
        ${b.steps ? `<pre class="steps-pre">${esc(b.steps)}</pre>` : ""}
        ${b.expected ? `<div class="subtitle">${esc(b.expected)}</div>` : ""}
        ${b.img ? `<img src="${b.img}" class="thumb" alt="Print do bug" />` : ""}
      `;
      card.querySelector(".btn-md").addEventListener("click", () => {
        navigator.clipboard.writeText(toMarkdown(b));
        alert("Markdown copiado para colar no GitHub Issue!");
      });
      card.querySelector(".btn-edit").addEventListener("click", () => openModal(b));
      els.bugList.appendChild(card);
    });
  }

  function openModal(b = null) {
    els.bId.value = b ? b.id : "";
    els.bTitle.value = b ? b.title : "";
    els.bSev.value = b ? b.sev : "medium";
    els.bStatus.value = b ? b.status : "open";
    els.bEnv.value = b ? b.env : "";
    els.bSteps.value = b ? b.steps : "";
    els.bExpected.value = b ? b.expected : "";
    draftImg = b?.img || "";
    if (draftImg) {
      els.bImgPreview.src = draftImg;
      els.bImgPreview.classList.remove("hidden");
    } else {
      els.bImgPreview.classList.add("hidden");
    }
    els.btnDelete.style.display = b ? "inline-block" : "none";
    els.bugModal.classList.remove("hidden");
  }

  function closeModal() { els.bugModal.classList.add("hidden"); }

  els.bImg.addEventListener("change", () => {
    const f = els.bImg.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      draftImg = String(reader.result || "");
      els.bImgPreview.src = draftImg;
      els.bImgPreview.classList.remove("hidden");
    };
    reader.readAsDataURL(f);
  });

  els.bugForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = els.bId.value;
    const item = {
      id: id || `b_${Date.now()}`,
      title: els.bTitle.value.trim(),
      sev: els.bSev.value,
      status: els.bStatus.value,
      env: els.bEnv.value.trim(),
      steps: els.bSteps.value.trim(),
      expected: els.bExpected.value.trim(),
      img: draftImg,
      createdAt: new Date().toISOString(),
    };
    if (id) {
      const idx = bugs.findIndex((x) => x.id === id);
      if (idx >= 0) bugs[idx] = item;
    } else {
      bugs.unshift(item);
    }
    save();
    closeModal();
    render();
  });

  els.btnDelete.addEventListener("click", () => {
    const id = els.bId.value;
    if (!id || !confirm("Excluir este bug?")) return;
    bugs = bugs.filter((b) => b.id !== id);
    save();
    closeModal();
    render();
  });

  els.btnExportJson.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(bugs, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "piercer_qa_bugs.json";
    a.click();
  });

  [els.searchInput, els.statusFilter, els.sevFilter].forEach((el) => el.addEventListener("input", render));
  els.btnNewBug.addEventListener("click", () => openModal(null));
  els.btnClose.addEventListener("click", closeModal);
  els.btnCancel.addEventListener("click", closeModal);
  render();
})();
