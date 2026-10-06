function renderExteriorPaintingPlanTable() {
  const mainTable = document.getElementById("main-table");
  mainTable.innerHTML = "";
  mainTable.classList.remove("hidden");
  
  const reportHeader = document.getElementById("report-header");
  if (reportHeader) reportHeader.classList.remove("hidden");
  
  if (!projectData.exteriorPainting) projectData.exteriorPainting = {};
  
  const tasks = ["ขัดแต่งรอยต่อ", "ทาสีรองพื้น", "เทสน้ำ", "ทาสีจริง"];
  
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr class="bg-sky-100">
      <th class="border border-slate-400 p-2 text-slate-700 font-bold">NO.</th>
      ${tasks.map(t => `<th class="border border-slate-400 p-2 text-slate-700 font-bold">${t}</th>`).join('')}
    </tr>
  `;
  mainTable.appendChild(thead);
  
  const tbody = document.createElement("tbody");
  for (let i = 1; i <= 37; i++) {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="border border-slate-300 p-2 text-center font-semibold bg-slate-50">${i}</td>`;
    
    tasks.forEach(task => {
      const data = projectData.exteriorPainting[i] && projectData.exteriorPainting[i][task] ? projectData.exteriorPainting[i][task] : null;
      let text = data && data.date ? data.date : "";
      let classList = "border border-slate-300 p-2 text-center min-w-[100px] cursor-pointer hover:bg-slate-100";
      if (data && data.isCompleted) {
         classList += " bg-emerald-100 text-emerald-700 font-bold";
         text = "แล้วเสร็จ";
      }
      
      row.innerHTML += `<td class="${classList}" data-no="${i}" data-task="${task}">${text}</td>`;
    });
    tbody.appendChild(row);
  }
  
  mainTable.appendChild(tbody);
  
  // Custom click handler
  mainTable.onclick = (e) => {
    const td = e.target.closest("td[data-no]");
    if (!td) return;
    
    const no = td.dataset.no;
    const task = td.dataset.task;
    
    // Open a simple modal to set date or toggle completion
    const currentData = projectData.exteriorPainting[no]?.[task] || {};
    
    // We can reuse the plan update modal if we modify it, or just create a simple prompt for now.
    // Let's create a custom modal or just prompt.
  };
}
