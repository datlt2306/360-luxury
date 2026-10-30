(function () {
    // Áp dụng style sáng sớm nhất có thể
    try {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function () { if (typeof forceLightChrome === "function") forceLightChrome(); });
        } else {
            setTimeout(function () { if (typeof forceLightChrome === "function") forceLightChrome(); }, 0);
        }
    } catch (e) { }

    const TABLE_ID = "checkInTable";
    const STORAGE_KEY = "columnToggleState_v3";
    const HEADER_STORAGE_KEY = "headerSectionVisible_v1";
    const SIDEBAR_STORAGE_KEY = "sidebarVisible_v1";
    const SELECTED_SV_STORAGE_KEY = "selectedStudentIndex_v1";
    const DEFAULT_HIDDEN_COLUMNS = ["Ghi chú điểm danh", "Nhận xét/ghi chú nộp bài", "AF/CC"];

    function loadState() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function applyStateToAllRows(table, state) {
        const rows = table.rows;
        Object.keys(state).forEach(idx => {
            const colIndex = parseInt(idx, 10);
            const isVisible = state[idx];
            for (let r = 0; r < rows.length; r++) {
                const cell = rows[r].cells[colIndex];
                if (cell) cell.style.display = isVisible ? "" : "none";
            }
        });
    }

    function toggleColumn(table, idx) {
        const rows = table.rows;
        if (!rows[0] || !rows[0].cells[idx]) return true;

        const isCurrentlyHidden = rows[0].cells[idx].style.display === "none";
        const shouldBeVisible = isCurrentlyHidden;

        for (let r = 0; r < rows.length; r++) {
            const cell = rows[r].cells[idx];
            if (cell) cell.style.display = shouldBeVisible ? "" : "none";
        }

        return shouldBeVisible;
    }

    function showAllColumns(table, state, buttons) {
        const rows = table.rows;
        const colCount = rows[0] ? rows[0].cells.length : 0;

        for (let i = 0; i < colCount; i++) {
            state[i] = true;
            for (let r = 0; r < rows.length; r++) {
                const cell = rows[r].cells[i];
                if (cell) cell.style.display = "";
            }
        }

        // Cập nhật class của tất cả buttons
        buttons.forEach(btn => btn.classList.remove("hidden"));

        saveState(state);
    }

    function injectButtons(table, state) {
        // Xóa container cũ nếu có
        const oldContainer = document.getElementById("column-toggle-container");
        if (oldContainer) oldContainer.remove();

        const headerCells = table.querySelectorAll("thead th");

        const container = document.createElement("div");
        container.id = "column-toggle-container";

        // Nút "Hiển thị tất cả"
        const showAllBtn = document.createElement("button");
        showAllBtn.textContent = "↻ Hiện tất cả";
        showAllBtn.className = "column-btn show-all-btn";
        container.appendChild(showAllBtn);

        const columnButtons = [];

        headerCells.forEach((th, i) => {
            const colName = (th.innerText || "").trim();
            // Các cột Chữ ký & Nhập điểm (custom) luôn hiển thị, không cho toggle
            if (th.classList.contains("e360-custom-col") || colName === "Chữ ký" || colName === "Nhập điểm") {
                // Đảm bảo luôn hiện
                state[i] = true;
                const rows = table.rows;
                for (let r = 0; r < rows.length; r++) {
                    const cell = rows[r].cells[i];
                    if (cell) cell.style.display = "";
                }
                return;
            }

            const btn = document.createElement("button");
            btn.textContent = colName || `Cột ${i + 1}`;
            btn.className = "column-btn";

            // Mặc định ẩn 3 cột: Ghi chú điểm danh, Nhận xét/ghi chú nộp bài, AF/CC
            if (state[i] === undefined) {
                const isDefaultHidden = DEFAULT_HIDDEN_COLUMNS.some(dh => 
                    colName.toLowerCase().includes(dh.toLowerCase()) || 
                    (dh === "AF/CC" && (colName.includes("AF") || colName.includes("CC")))
                );
                state[i] = !isDefaultHidden;
            }

            if (state[i] === false) btn.classList.add("hidden");

            btn.onclick = () => {
                const visible = toggleColumn(table, i);
                state[i] = visible;
                saveState(state);

                if (!visible) btn.classList.add("hidden");
                else btn.classList.remove("hidden");
            };

            columnButtons.push(btn);
            container.appendChild(btn);
        });

        // Gắn sự kiện cho nút "Hiện tất cả"
        showAllBtn.onclick = () => {
            showAllColumns(table, state, columnButtons);
        };

        table.parentNode.insertBefore(container, table);
    }

    function injectHeaderToggle() {
        const headerSection = document.querySelector("section.content-header-big");
        if (!headerSection) return;

        const boxBody = document.querySelector("div.box-body");
        const contentWrapper = document.querySelector("div.content-wrapper");

        // Xóa nút cũ nếu có
        const oldBtn = document.getElementById("header-toggle-btn");
        if (oldBtn) oldBtn.remove();

        // Load trạng thái từ localStorage
        const isVisible = localStorage.getItem(HEADER_STORAGE_KEY) !== "false";

        // Áp dụng trạng thái
        headerSection.style.display = isVisible ? "" : "none";
        if (boxBody) {
            boxBody.style.paddingTop = isVisible ? "90px" : "5px";
        }
        if (contentWrapper) {
            contentWrapper.style.paddingTop = isVisible ? "90px" : "0px";
        }

        // Tạo nút toggle
        const btn = document.createElement("button");
        btn.id = "header-toggle-btn";
        btn.textContent = isVisible ? "👁 Ẩn Header" : "👁 Hiện Header";
        btn.className = "column-btn header-toggle-btn" + (isVisible ? "" : " hidden");

        btn.onclick = () => {
            const currentlyVisible = headerSection.style.display !== "none";
            const newVisible = !currentlyVisible;

            headerSection.style.display = newVisible ? "" : "none";
            localStorage.setItem(HEADER_STORAGE_KEY, newVisible);

            // Điều chỉnh padding-top của box-body
            if (boxBody) {
                boxBody.style.paddingTop = newVisible ? "90px" : "5px";
            }

            // Điều chỉnh padding-top của content-wrapper
            if (contentWrapper) {
                contentWrapper.style.paddingTop = newVisible ? "90px" : "0px";
            }

            btn.textContent = newVisible ? "👁 Ẩn Header" : "👁 Hiện Header";
            if (newVisible) btn.classList.remove("hidden");
            else btn.classList.add("hidden");
        };

        // Thêm vào container của column toggles
        const container = document.getElementById("column-toggle-container");
        if (container) {
            container.appendChild(btn);
        } else {
            // Nếu chưa có container, thêm trước header section
            headerSection.parentNode.insertBefore(btn, headerSection);
        }
    }

    function injectSidebarToggle() {
        const sidebar = document.querySelector("aside.main-sidebar");
        if (!sidebar) return;

        const contentWrapper = document.querySelector("div.content-wrapper");
        const mainHeader = document.querySelector("header.main-header");
        const wrapper = document.querySelector("div.wrapper");

        // Xóa nút cũ nếu có
        const oldBtn = document.getElementById("sidebar-toggle-btn");
        if (oldBtn) oldBtn.remove();

        // Load trạng thái từ localStorage
        const isVisible = localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "false";

        // Áp dụng trạng thái
        sidebar.style.display = isVisible ? "" : "none";
        if (contentWrapper) {
            contentWrapper.style.marginLeft = isVisible ? "" : "5px";
        }
        if (mainHeader) {
            mainHeader.style.display = isVisible ? "" : "none";
        }

        // Tạo nút toggle
        const btn = document.createElement("button");
        btn.id = "sidebar-toggle-btn";
        btn.textContent = isVisible ? "◀ Ẩn Sidebar" : "▶ Hiện Sidebar";
        btn.className = "column-btn sidebar-toggle-btn" + (isVisible ? "" : " hidden");

        btn.onclick = () => {
            const currentlyVisible = sidebar.style.display !== "none";
            const newVisible = !currentlyVisible;

            sidebar.style.display = newVisible ? "" : "none";
            localStorage.setItem(SIDEBAR_STORAGE_KEY, newVisible);

            // Điều chỉnh margin-left của content-wrapper
            if (contentWrapper) {
                contentWrapper.style.marginLeft = newVisible ? "" : "5px";
            }

            // Ẩn/hiện main-header
            if (mainHeader) {
                mainHeader.style.display = newVisible ? "" : "none";
            }

            btn.textContent = newVisible ? "◀ Ẩn Sidebar" : "▶ Hiện Sidebar";
            if (newVisible) btn.classList.remove("hidden");
            else btn.classList.add("hidden");
        };

        // Thêm vào container của column toggles
        const container = document.getElementById("column-toggle-container");
        if (container) {
            container.appendChild(btn);
        }
    }

    function createQuickNavPanel(table) {
        const tbody = table.querySelector("tbody");
        if (!tbody) return;

        // Chỉ lấy các dòng sinh viên thực sự, bỏ qua dòng thông báo loading hoặc dataTables_empty
        const rows = Array.from(tbody.querySelectorAll("tr")).filter(r => !r.querySelector(".dataTables_empty"));
        if (rows.length === 0) return;

        // Xóa panel cũ nếu có
        const oldPanel = document.getElementById("quick-nav-panel");
        if (oldPanel) oldPanel.remove();

        const COLLAPSED_STORAGE_KEY = "quickNavPanelCollapsed_v1";
        const isCollapsed = localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";

        // Tạo panel
        const panel = document.createElement("div");
        panel.id = "quick-nav-panel";
        panel.innerHTML = `
            <div id="quick-nav-header">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <button id="quick-nav-toggle-btn" class="quick-nav-icon-btn" title="Thu nhỏ / Mở rộng">${isCollapsed ? "▸" : "▾"}</button>
                    <span>📋 Danh sách SV</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button id="quick-nav-close">✕</button>
                </div>
            </div>
            <div id="quick-nav-list" style="${isCollapsed ? "display: none;" : ""}"></div>
        `;

        // Style cho panel (Apple Cupertino Floating HUD)
        Object.assign(panel.style, {
            position: "fixed",
            top: "90px",
            right: "20px",
            width: "260px",
            maxHeight: "600px",
            background: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "16px",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)",
            zIndex: "999999",
            overflow: "hidden",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
        });

        document.body.appendChild(panel);

        // Style cho header (draggable)
        const header = panel.querySelector("#quick-nav-header");
        Object.assign(header.style, {
            background: "rgba(245, 245, 247, 0.95)",
            color: "#1d1d1f",
            padding: "10px 14px",
            cursor: "move",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: "600",
            fontSize: "16px",
            borderBottom: isCollapsed ? "none" : "1px solid rgba(0, 0, 0, 0.08)",
            userSelect: "none"
        });

        // Nút toggle thu gọn / mở rộng ở đầu header
        const toggleBtn = panel.querySelector("#quick-nav-toggle-btn");
        const listContainer = panel.querySelector("#quick-nav-list");

        const toggleCollapse = () => {
            const currentlyHidden = listContainer.style.display === "none";
            if (currentlyHidden) {
                listContainer.style.display = "block";
                toggleBtn.textContent = "▾";
                header.style.borderBottom = "1px solid rgba(0, 0, 0, 0.08)";
                localStorage.setItem(COLLAPSED_STORAGE_KEY, "false");
            } else {
                listContainer.style.display = "none";
                toggleBtn.textContent = "▸";
                header.style.borderBottom = "none";
                localStorage.setItem(COLLAPSED_STORAGE_KEY, "true");
            }
        };

        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            toggleCollapse();
        };

        header.ondblclick = (e) => {
            if (e.target !== closeBtn) {
                toggleCollapse();
            }
        };

        // Nút đóng
        const closeBtn = panel.querySelector("#quick-nav-close");
        Object.assign(closeBtn.style, {
            background: "transparent",
            border: "none",
            color: "#86868b",
            fontSize: "15px",
            cursor: "pointer",
            padding: "0 4px",
            lineHeight: "1"
        });
        closeBtn.onclick = () => panel.style.display = "none";

        // Danh sách
        Object.assign(listContainer.style, {
            maxHeight: "500px",
            overflowY: "auto",
            padding: "6px"
        });

        // Lấy index các cột quan trọng (dùng textContent để không bị ảnh hưởng bởi CSS text-transform)
        const headers = Array.from(table.querySelectorAll("thead th")).map(th => (th.textContent || th.innerText || "").trim().toLowerCase());
        const rawNameIdx = headers.findIndex(h => h.includes("họ tên") || h.includes("ho ten") || h.includes("họ và tên"));
        const rawAfccIdx = headers.findIndex(h => h.includes("af/cc") || h.includes("af") || h.includes("cc"));
        const rawCheckInIdx = headers.findIndex(h => h.includes("điểm danh") || h.includes("diem danh"));
        const rawScoreIdx = headers.findIndex(h => (h.includes("nộp bài") || h.includes("nop bai") || h.includes("điểm") || h.includes("diem")) && !h.includes("điểm danh") && !h.includes("nhập điểm"));

        // Fallback sang index mặc định của bảng nếu không tìm thấy header
        const nameIdx = rawNameIdx !== -1 ? rawNameIdx : 3;
        const afccIdx = rawAfccIdx !== -1 ? rawAfccIdx : 5;
        const checkInIdx = rawCheckInIdx !== -1 ? rawCheckInIdx : 7;
        const scoreIdx = rawScoreIdx !== -1 ? rawScoreIdx : 9;

        // Thêm từng sinh viên vào danh sách
        rows.forEach((row, index) => {
            const cells = row.cells;
            if (!cells || cells.length <= 1 || row.querySelector(".dataTables_empty")) return;

            const sttCell = cells[0];
            const nameCell = cells[nameIdx];
            const afccCell = afccIdx !== -1 ? cells[afccIdx] : null;

            // Tìm cell chứa điểm: ưu tiên scoreIdx (cột Nộp bài), nếu không có thì quét tìm cell có scoreWrap hoặc input
            let targetScoreCell = cells[scoreIdx];
            if (!targetScoreCell || (!targetScoreCell.querySelector('[id^="scoreWrap_"]') && !targetScoreCell.querySelector('.e360-score-input'))) {
                for (let c of cells) {
                    if (c.querySelector('[id^="scoreWrap_"]') || c.querySelector('.e360-score-input') || (c.innerHTML && c.innerHTML.includes('InputScore('))) {
                        targetScoreCell = c;
                        break;
                    }
                }
            }

            const name = nameCell?.innerText?.trim() || `SV ${index + 1}`;
            const stt = sttCell?.innerText?.trim() || (index + 1);

            // Kiểm tra trạng thái điểm
            let score = "";
            let hasSigned = false;
            let isApproved = false;
            let isScored = false;

            if (targetScoreCell) {
                const html = targetScoreCell.innerHTML;
                const text = targetScoreCell.innerText;
                
                // 1. Tìm điểm số từ scoreWrap_{id}
                const scoreElem = targetScoreCell.querySelector('[id^="scoreWrap_"]');
                if (scoreElem && scoreElem.innerText.trim()) {
                    const tempScore = scoreElem.innerText.trim();
                    if (tempScore && tempScore.toUpperCase() !== "N/A" && tempScore !== "...") {
                        score = tempScore;
                        isScored = true;
                    }
                }

                // 2. Nếu chưa có, tìm từ ô input inline .e360-score-input
                if (!score) {
                    const inlineInput = targetScoreCell.querySelector('.e360-score-input');
                    if (inlineInput && inlineInput.value.trim()) {
                        score = inlineInput.value.trim();
                        isScored = true;
                    }
                }

                // 3. Nếu chưa có, tìm từ regex
                if (!score) {
                    const scoreMatch = text.match(/(?:PRO|ASM|SPEAKING|EOS)[:\s]*([\d\.]+)/i) || text.match(/[:\s]+([\d\.]+)/);
                    if (scoreMatch) {
                        score = scoreMatch[1];
                        isScored = true;
                    }
                }

                if (text.includes("Đã ký") || html.includes("Đã ký")) hasSigned = true;
                if (html.includes("CTHĐ duyệt") || text.includes("CTHĐ duyệt")) isApproved = true;
            }

            const item = document.createElement("div");
            item.className = "quick-nav-item";

            const checkInCell = checkInIdx !== -1 ? cells[checkInIdx] : null;
            let checkInStatus = "NONE";
            if (checkInCell) {
                const checkedRadio = checkInCell.querySelector('input[type="radio"]:checked');
                if (checkedRadio) {
                    const onclickAttr = checkedRadio.getAttribute('onclick') || '';
                    if (onclickAttr.includes('PRESENT')) {
                        checkInStatus = 'PRESENT';
                    } else if (onclickAttr.includes('ABSENT')) {
                        checkInStatus = 'ABSENT';
                    } else if (onclickAttr.includes('LATE')) {
                        checkInStatus = 'LATE';
                    }
                }
            }

            let nameColor = "#d32f2f"; // Mặc định màu đỏ cho chưa chọn hoặc vắng
            let statusSuffix = "";

            if (checkInStatus === "PRESENT" || checkInStatus === "LATE") {
                nameColor = "#2e7d32"; // Màu xanh cho có mặt
                statusSuffix = " (P)";
            } else if (checkInStatus === "ABSENT") {
                nameColor = "#d32f2f"; // Màu đỏ cho vắng mặt
                statusSuffix = " (A)";
            }

            // Hiển thị tên và điểm
            const sttSpan = `<span style="color:${nameColor}; font-weight: 500;">${stt}. ${name}${statusSuffix}</span>`;
            const scoreSpan = (score && score.toUpperCase() !== "N/A") ? `<span style="color:#0071e3; font-weight: 700; margin-left: auto; background: rgba(0, 113, 227, 0.1); padding: 2px 8px; border-radius: 6px; font-size: 14px;">${score}</span>` : "";
            
            item.innerHTML = sttSpan + scoreSpan;
            item.style.display = "flex";
            item.style.alignItems = "center";
            item.style.justifyContent = "space-between";
            Object.assign(item.style, {
                padding: "8px 10px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                fontSize: "15px",
                transition: "background 0.2s",
                background: hasSigned ? "#e0e0e0" : ""
            });

            item.onmouseenter = () => item.style.background = "#e3f2fd";
            item.onmouseleave = () => item.style.background = hasSigned ? "#e0e0e0" : "";

            item.onclick = () => {
                // Copy họ tên sinh viên vào clipboard
                navigator.clipboard.writeText(name).then(() => {
                    // Hiển thị thông báo nhỏ
                    const toast = document.createElement("div");
                    toast.textContent = `📋 Đã copy: ${name}`;
                    Object.assign(toast.style, {
                        position: "fixed",
                        bottom: "20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#323232",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "4px",
                        zIndex: "9999999",
                        fontSize: "13px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
                    });
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 1500);
                }).catch(() => {});

                // Xóa highlight cũ (chỉ khi chọn người khác)
                document.querySelectorAll(".highlight-row").forEach(el => {
                    el.classList.remove("highlight-row");
                    el.style.backgroundColor = "";
                    el.style.border = "";
                });

                // Cuộn đến dòng
                row.scrollIntoView({ behavior: "smooth", block: "center" });

                // Highlight dòng - giữ lại cho đến khi chọn người khác
                row.classList.add("highlight-row");
                row.style.backgroundColor = "#c8e6c9"; // light green
                row.style.border = "3px solid #d32f2f"; // red border

                // Lưu vị trí sinh viên đang chọn
                localStorage.setItem(SELECTED_SV_STORAGE_KEY, index.toString());

                // Highlight item đang chọn trong panel
                listContainer.querySelectorAll(".quick-nav-item").forEach(el => {
                    el.classList.remove("selected-sv");
                    el.style.fontWeight = "";
                });
                item.classList.add("selected-sv");
                item.style.fontWeight = "bold";
            };

            listContainer.appendChild(item);
        });

        // Draggable functionality
        let isDragging = false;
        let offsetX, offsetY;

        header.onmousedown = (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            header.style.cursor = "grabbing";
        };

        document.onmousemove = (e) => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
        };

        document.onmouseup = () => {
            isDragging = false;
            header.style.cursor = "move";
        };

        // Thêm nút mở lại panel vào container
        const container = document.getElementById("column-toggle-container");
        if (container) {
            const showPanelBtn = document.createElement("button");
            showPanelBtn.id = "show-nav-panel-btn";
            showPanelBtn.textContent = "📋 DS Sinh viên";
            showPanelBtn.className = "column-btn show-nav-panel-btn";

            showPanelBtn.onclick = () => {
                panel.style.display = panel.style.display === "none" ? "" : "none";
            };

            // Xóa nút cũ nếu có
            const oldBtn = document.getElementById("show-nav-panel-btn");
            if (oldBtn) oldBtn.remove();

            container.appendChild(showPanelBtn);
        }

        // Khôi phục sinh viên đã chọn từ localStorage
        const savedIndex = localStorage.getItem(SELECTED_SV_STORAGE_KEY);
        if (savedIndex !== null) {
            const idx = parseInt(savedIndex, 10);
            const items = listContainer.querySelectorAll(".quick-nav-item");
            if (items[idx]) {
                items[idx].classList.add("selected-sv");
                items[idx].style.fontWeight = "bold";
                // Cuộn panel con đến item đã chọn
                items[idx].scrollIntoView({ behavior: "auto", block: "center" });
                // Đánh dấu highlight dòng trên bảng (KHÔNG tự cuộn màn hình để tránh giật lag khi bảng refresh)
                const tableRows = tbody.querySelectorAll("tr");
                if (tableRows[idx]) {
                    tableRows[idx].classList.add("highlight-row");
                    tableRows[idx].style.backgroundColor = "#c8e6c9";
                    tableRows[idx].style.border = "3px solid #d32f2f";
                }
            }
        }
    }

    // Chuyển đổi radio điểm danh thành công tắc gạt Apple Cupertino Segmented Switch
    function transformCheckInToSegmentedSwitch(table) {
        if (!table) return;
        const tbody = table.querySelector("tbody");
        if (!tbody) return;

        // Tìm index của cột "Điểm danh?"
        let checkInIdx = -1;
        const ths = table.querySelectorAll("thead th");
        ths.forEach((th, idx) => {
            const text = (th.textContent || th.innerText).trim().toLowerCase();
            if (text.includes("điểm danh") && !text.includes("ghi chú")) {
                checkInIdx = idx;
            }
        });
        if (checkInIdx === -1) checkInIdx = 7;

        const rows = tbody.querySelectorAll("tr");
        rows.forEach(row => {
            const checkInCell = row.cells[checkInIdx];
            if (!checkInCell) return;

            // Đã chuyển đổi rồi thì không làm lại
            if (checkInCell.querySelector(".e360-checkin-switch")) return;

            // Tìm tất cả radio inputs trong cell
            const radios = Array.from(checkInCell.querySelectorAll('input[type="radio"]'));
            if (radios.length === 0) return;

            const switchContainer = document.createElement("div");
            switchContainer.className = "e360-checkin-switch";
            switchContainer.setAttribute("role", "radiogroup");

            radios.forEach(radio => {
                // Xác định nhãn text
                let labelText = "";
                let nextNode = radio.nextSibling;
                while (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
                    labelText += nextNode.textContent;
                    nextNode = nextNode.nextSibling;
                }
                labelText = labelText.trim();
                if (!labelText) {
                    labelText = radio.getAttribute("title") || "Option";
                }

                // Xác định trạng thái
                const lowerText = labelText.toLowerCase();
                const titleText = (radio.getAttribute("title") || "").toLowerCase();
                const onClickText = radio.getAttribute("onclick") || "";

                let statusType = "present";
                if (lowerText.includes("vắng") || lowerText.includes("absent") || titleText.includes("absent") || onClickText.includes("ABSENT")) {
                    statusType = "absent";
                } else if (lowerText.includes("muộn") || lowerText.includes("late") || titleText.includes("late") || onClickText.includes("LATE")) {
                    statusType = "late";
                } else if (lowerText.includes("có") || lowerText.includes("present") || titleText.includes("present") || onClickText.includes("PRESENT")) {
                    statusType = "present";
                }

                // Tạo segment item (label bọc input)
                const itemLabel = document.createElement("label");
                itemLabel.className = `e360-switch-item e360-switch-${statusType}`;
                itemLabel.title = labelText;

                // Tinh chỉnh input radio
                radio.classList.add("e360-switch-radio");
                radio.removeAttribute("style");

                // Dot chỉ thị trạng thái
                const indicator = document.createElement("span");
                indicator.className = "e360-switch-indicator";

                // Text nhãn
                const textSpan = document.createElement("span");
                textSpan.className = "e360-switch-text";
                textSpan.textContent = labelText;

                // Ráp vào label
                itemLabel.appendChild(radio);
                itemLabel.appendChild(indicator);
                itemLabel.appendChild(textSpan);

                switchContainer.appendChild(itemLabel);
            });

            // Xóa sạch nội dung cũ trong cell và gắn switchContainer vào
            while (checkInCell.firstChild) {
                checkInCell.removeChild(checkInCell.firstChild);
            }
            checkInCell.appendChild(switchContainer);
        });
    }

    // Xử lý màu sắc cho bảng lịch bảo vệ (#scheduleTable)
    function processScheduleTable() {
        const table = document.getElementById("scheduleTable");
        if (!table) return;

        const tbody = table.querySelector("tbody");
        if (!tbody) return;

        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const rows = tbody.querySelectorAll("tr");
        rows.forEach(row => {
            const cells = row.cells;
            if (cells.length < 5) return;

            let btn = row.querySelector("a.btn, button.btn");
            if (!btn) return;

            const btnText = btn.innerText.trim().toLowerCase();
            const isClosed = cells[1].innerText.toLowerCase().includes("closed");

            let bgColor = "";
            let textColor = "white";

            if (isClosed) {
                bgColor = "#94a3b8"; // Xám (Đã đóng)
            } else {
                // Lấy thông tin thời gian bắt đầu từ cột "T/g bđ" (index 6)
                const startTimeCell = cells[6];
                const timeRangeText = startTimeCell ? startTimeCell.innerText.trim() : "";
                const timeMatch = timeRangeText.match(/(\d{1,2})[h:](\d{2})/);

                if (timeMatch) {
                    const startHour = parseInt(timeMatch[1], 10);
                    const startMinute = parseInt(timeMatch[2], 10);
                    const startTotalMinutes = startHour * 60 + startMinute;

                    const isAccepted = btnText.includes("vào ca thi") || btnText.includes("vào phòng");

                    if (currentTotalMinutes < startTotalMinutes) {
                        // TƯƠNG LAI -> Luôn màu Da cam theo yêu cầu
                        bgColor = "#f59e0b"; 
                    } else {
                        // HIỆN TẠI HOẶC QUÁ KHỨ
                        if (isAccepted) {
                            bgColor = "#10b981"; // Xanh Green (Đang diễn ra)
                        } else {
                            bgColor = "#ef4444"; // Đỏ (Trễ giờ chưa nhận)
                        }
                    }
                } else {
                    // Mặc định nếu không có giờ
                    bgColor = btnText.includes("vào ca bảo vệ") ? "#10b981" : "#f59e0b";
                }
            }

            if (bgColor) {
                btn.style.setProperty("background-color", bgColor, "important");
                btn.style.setProperty("border-color", bgColor, "important");
                btn.style.setProperty("color", textColor, "important");
                btn.style.setProperty("font-weight", "600", "important");
                btn.style.setProperty("transition", "all 0.2s", "important");
            }
        });
    }

    // ==================== INLINE SCORE INPUT (NON-DATN) ====================

    // Kiểm tra xem dòng sinh viên có thuộc Dự án tốt nghiệp (DATN) hay không
    function isDATNRow(row, table) {
        if (!row || !row.cells) return false;

        // Lấy danh sách tiêu đề cột (dùng textContent tránh ảnh hưởng bởi text-transform)
        const headers = Array.from(table.querySelectorAll("thead th")).map(th => (th.textContent || th.innerText || "").trim().toLowerCase());
        const rawSubjectIdx = headers.findIndex(h => h.includes("môn thi") || h.includes("mon thi"));
        const rawScoreIdx = headers.findIndex(h => (h.includes("nộp bài") || h.includes("nop bai") || h.includes("điểm") || h.includes("diem")) && !h.includes("điểm danh") && !h.includes("nhập điểm"));

        const subjectIdx = rawSubjectIdx !== -1 ? rawSubjectIdx : 4;
        const scoreIdx = rawScoreIdx !== -1 ? rawScoreIdx : 9;

        // 1. Kiểm tra mã môn thi (thường ở cột index 4)
        if (subjectIdx !== -1 && row.cells[subjectIdx]) {
            const subjectText = row.cells[subjectIdx].innerText.trim().toUpperCase();
            if (/^PRO\d+/i.test(subjectText) || 
                subjectText.includes("DATN") || 
                subjectText.includes("DỰ ÁN TỐT NGHIỆP") || 
                subjectText.includes("DO AN TOT NGHIEP") ||
                subjectText.includes("CAPSTONE")) {
                return true;
            }
        }

        // 2. Kiểm tra cột Nộp bài (thường ở cột index 9)
        const checkCell = scoreIdx !== -1 && row.cells[scoreIdx] ? row.cells[scoreIdx] : null;
        if (checkCell) {
            const html = checkCell.innerHTML.toUpperCase();
            const text = checkCell.innerText.toUpperCase();
            if (text.includes("PRO:") || html.includes("PRO:") || text.includes("CTHĐ") || text.includes("HỘI ĐỒNG")) {
                return true;
            }
        }

        return false;
    }

    // Lưu điểm qua iframe ngầm
    function saveScoreViaIframe(studentId, score, callback) {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.top = "-9999px";
        iframe.style.left = "-9999px";
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        iframe.style.opacity = "0";
        iframe.style.pointerEvents = "none";
        iframe.src = "/Proctor/InputScore?sssID=" + studentId;

        document.body.appendChild(iframe);

        let isDone = false;
        let loadCount = 0;

        const timeout = setTimeout(() => {
            if (!isDone) {
                isDone = true;
                if (iframe.parentNode) iframe.remove();
                callback(false, "Timeout khi kết nối server");
            }
        }, 15000);

        iframe.onload = () => {
            if (isDone) return;
            loadCount++;
            if (loadCount > 1) return;

            try {
                // Tự động đồng ý các popup confirm nếu có
                if (iframe.contentWindow) {
                    try {
                        iframe.contentWindow.confirm = () => true;
                        if (iframe.contentWindow.e360DialogConfirm) {
                            iframe.contentWindow.e360DialogConfirm = () => Promise.resolve(true);
                        }
                    } catch (e) {}
                }

                const idoc = iframe.contentDocument || iframe.contentWindow.document;
                if (!idoc) return;

                setTimeout(() => {
                    if (isDone) return;
                    try {
                        let inputs = idoc.querySelectorAll('input.score-input, input[id^="txtScore_"]');
                        if (inputs.length === 0) {
                            inputs = idoc.querySelectorAll('#tblScore input[type="text"], #tblScore input[type="number"]');
                        }

                        if (inputs.length === 0) {
                            isDone = true;
                            clearTimeout(timeout);
                            if (iframe.parentNode) iframe.remove();
                            callback(false, "Không tìm thấy form nhập điểm");
                            return;
                        }

                        // Điền điểm vào các ô tiêu chí
                        inputs.forEach(input => {
                            input.value = score;
                            input.dispatchEvent(new Event("input", { bubbles: true }));
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                            input.dispatchEvent(new Event("blur", { bubbles: true }));
                        });

                        // Tìm nút Lưu điểm
                        const saveBtn = idoc.querySelector('button[onclick*="SaveAllScore"]') || 
                                        idoc.querySelector('#btnSaveAll') ||
                                        idoc.querySelector('button.btn-success') || 
                                        idoc.querySelector('button.btn-primary') || 
                                        idoc.querySelector('button[type="submit"]');

                        if (saveBtn) {
                            saveBtn.click();

                            // Xử lý popup xác nhận nếu có
                            setTimeout(() => {
                                try {
                                    const buttons = Array.from(idoc.querySelectorAll("button, .btn, .ui-button"));
                                    const confirmBtn = buttons.find(b => {
                                        const t = (b.innerText || "").trim().toLowerCase();
                                        return t === "xác nhận" || t === "đồng ý" || t === "ok" || t === "yes";
                                    });
                                    if (confirmBtn) {
                                        confirmBtn.click();
                                    }
                                } catch (e) {}

                                // Chờ server xử lý lưu điểm rồi đóng iframe
                                setTimeout(() => {
                                    if (!isDone) {
                                        isDone = true;
                                        clearTimeout(timeout);
                                        if (iframe.parentNode) iframe.remove();
                                        callback(true);
                                    }
                                }, 1500);
                            }, 500);
                        } else {
                            const form = idoc.querySelector("form");
                            if (form) {
                                form.submit();
                                setTimeout(() => {
                                    if (!isDone) {
                                        isDone = true;
                                        clearTimeout(timeout);
                                        if (iframe.parentNode) iframe.remove();
                                        callback(true);
                                    }
                                }, 1500);
                            } else {
                                isDone = true;
                                clearTimeout(timeout);
                                if (iframe.parentNode) iframe.remove();
                                callback(false, "Không thấy nút lưu");
                            }
                        }
                    } catch (err) {
                        isDone = true;
                        clearTimeout(timeout);
                        if (iframe.parentNode) iframe.remove();
                        callback(false, "Lỗi xử lý: " + err.message);
                    }
                }, 400);
            } catch (err) {
                isDone = true;
                clearTimeout(timeout);
                if (iframe.parentNode) iframe.remove();
                callback(false, "Lỗi iframe: " + err.message);
            }
        };
    }

    // Tái cấu trúc các cột bảng: tách Chữ ký và Nhập điểm ra 2 cột riêng ở cuối
    function reorganizeTableColumns(table) {
        if (!table) return;

        const thead = table.querySelector("thead");
        const tbody = table.querySelector("tbody");
        if (!thead || !tbody) return;

        const headerRow = thead.querySelector("tr");
        if (!headerRow) return;

        // 1. Đảm bảo 2 header Chữ ký và Nhập điểm có mặt ở thead
        let sigTh = headerRow.querySelector(".e360-col-signature-th");
        if (!sigTh) {
            sigTh = document.createElement("th");
            sigTh.className = "no-sort e360-custom-col e360-col-signature-th";
            sigTh.textContent = "Chữ ký";
            headerRow.appendChild(sigTh);
        }

        // Nút "Ký tất cả" cạnh tiêu đề Chữ ký
        let bulkSignBtn = sigTh.querySelector(".e360-bulk-sign-btn");
        if (!bulkSignBtn) {
            bulkSignBtn = document.createElement("button");
            bulkSignBtn.type = "button";
            bulkSignBtn.className = "e360-bulk-sign-btn";
            bulkSignBtn.textContent = "Ký tất cả";
            bulkSignBtn.title = "Ký hàng loạt (chỉ khi tất cả SV đã có điểm)";
            bulkSignBtn.disabled = true;
            sigTh.appendChild(document.createElement("br"));
            sigTh.appendChild(bulkSignBtn);
        }

        // Gắn sự kiện click (tránh gắn trùng)
        if (!bulkSignBtn.dataset.bound) {
            bulkSignBtn.dataset.bound = "1";
            bulkSignBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                bulkSignAll(table);
            };
        }

        let scoreTh = headerRow.querySelector(".e360-col-score-th");
        if (!scoreTh) {
            scoreTh = document.createElement("th");
            scoreTh.className = "no-sort e360-custom-col e360-col-score-th";
            scoreTh.textContent = "Nhập điểm";
            headerRow.appendChild(scoreTh);
        }

        // 2. Tìm index của cột "Nộp bài?" và đổi tên thành "Điểm"
        let submitColIdx = -1;
        const ths = headerRow.querySelectorAll("th");
        ths.forEach((th, idx) => {
            const text = (th.textContent || th.innerText).trim().toLowerCase();
            if ((text.includes("nộp bài") || text === "điểm" || th.classList.contains("e360-col-diem-th")) && !text.includes("ghi chú") && !text.includes("nhận xét") && !th.classList.contains("e360-col-score-th")) {
                submitColIdx = idx;
                th.textContent = "Điểm";
                th.classList.add("e360-col-diem-th");
            }
        });
        if (submitColIdx === -1) submitColIdx = 9;

        // 3. Xử lý từng dòng trong tbody
        const rows = tbody.querySelectorAll("tr");
        rows.forEach(row => {
            if (row.querySelector(".dataTables_empty")) return;

            // Đảm bảo 2 cell Chữ ký và Nhập điểm luôn có mặt ở cuối row
            let tdSig = row.querySelector(".e360-col-signature-td");
            if (!tdSig) {
                tdSig = document.createElement("td");
                tdSig.className = "text-center e360-custom-col e360-col-signature-td";
                row.appendChild(tdSig);
            }

            let tdScore = row.querySelector(".e360-col-score-td");
            if (!tdScore) {
                tdScore = document.createElement("td");
                tdScore.className = "text-center e360-custom-col e360-col-score-td";
                row.appendChild(tdScore);
            }

            // Với dòng DATN: giữ nguyên cấu trúc cũ, chỉ để trống 2 ô mới
            if (isDATNRow(row, table)) return;

            const submitCell = row.cells[submitColIdx];
            if (!submitCell) return;

            // Ẩn nút "Nhập điểm" cũ
            const oldInputBtns = submitCell.querySelectorAll('i, a, span');
            oldInputBtns.forEach(el => {
                const title = el.getAttribute("title") || "";
                const alt = el.getAttribute("alt") || "";
                const text = el.textContent || "";
                if (title === "Nhập điểm" || alt === "Nhập điểm" || text.includes("Nhập điểm")) {
                    el.style.display = "none";
                }
            });

            // Ẩn hoàn toàn biểu tượng reload 🔄 cạnh điểm (RefreshScore)
            const reloadScoreBtns = submitCell.querySelectorAll('[onclick*="RefreshScore"], [title*="Tải lại điểm"]');
            reloadScoreBtns.forEach(btn => {
                btn.style.display = "none";
            });

            // Container cho cột Chữ ký
            let sigContainer = tdSig.querySelector(".e360-signature-container");
            if (!sigContainer) {
                sigContainer = document.createElement("div");
                sigContainer.className = "e360-signature-container";
                tdSig.appendChild(sigContainer);
            }

            // Ô tick (checkbox) thuộc cột chữ ký -> chuyển từ submitCell sang tdSig
            const checkoutCheckbox = submitCell.querySelector('input[type="checkbox"]');
            if (checkoutCheckbox && checkoutCheckbox.parentNode !== sigContainer) {
                checkoutCheckbox.classList.add("e360-sig-checkbox");
                sigContainer.prepend(checkoutCheckbox);
            }

            // Xóa bỏ hoàn toàn biểu tượng reload 🔄 ở cột chữ ký theo yêu cầu
            const refreshSignBtn = submitCell.querySelector('[onclick*="RefreshSign"]') || sigContainer.querySelector('[onclick*="RefreshSign"], .e360-refresh-icon');
            if (refreshSignBtn) {
                refreshSignBtn.remove();
            }

            // Di chuyển chữ ký từ submitCell sang tdSig (dạng text thuần, không bo viền nút)
            const signWrap = submitCell.querySelector('[id^="signWrap_"]');

            if (signWrap && signWrap.parentNode !== sigContainer && !sigContainer.contains(signWrap)) {
                const textElem = document.createElement("span");
                textElem.className = "e360-sig-badge";
                textElem.appendChild(signWrap);

                const signText = textElem.innerText || "";
                if (signText.includes("Đã ký")) {
                    textElem.classList.add("sig-signed");
                } else if (signText.includes("Không ký")) {
                    textElem.classList.add("sig-refused");
                } else {
                    textElem.classList.add("sig-unsigned");
                }

                sigContainer.appendChild(textElem);
            } else if (sigContainer.querySelector(".e360-sig-badge")) {
                const textElem = sigContainer.querySelector(".e360-sig-badge");
                const signText = textElem.innerText || "";
                textElem.classList.remove("sig-signed", "sig-unsigned", "sig-refused");
                if (signText.includes("Đã ký")) {
                    textElem.classList.add("sig-signed");
                } else if (signText.includes("Không ký")) {
                    textElem.classList.add("sig-refused");
                } else {
                    textElem.classList.add("sig-unsigned");
                }
            }

            // Xóa chữ "ASM:", "SPEAKING:", "EOS:" và các thẻ thừa trong cột Điểm
            Array.from(submitCell.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = node.textContent.replace(/(?:ASM|SPEAKING|EOS|PRO)\s*:\s*/gi, "").trim();
                }
            });
            submitCell.querySelectorAll("br").forEach(br => br.remove());

            // Nếu ô Điểm còn dính inline-score-wrap thì chuyển sang tdScore
            const orphanWrap = submitCell.querySelector(".e360-inline-score-wrap");
            if (orphanWrap && orphanWrap.parentNode !== tdScore) {
                tdScore.appendChild(orphanWrap);
            }
        });
    }

    // Lấy ID sinh viên chuẩn xác từ row
    function getStudentIdFromRow(row) {
        if (!row) return null;
        // 1. Radio data-checkin-item-id
        const itemRadio = row.querySelector('[data-checkin-item-id]');
        if (itemRadio) {
            const id = itemRadio.getAttribute('data-checkin-item-id');
            if (id) return id;
        }
        // 2. Radio name="answer_..."
        const radioName = row.querySelector('input[name^="answer_"]');
        if (radioName) {
            const m = radioName.name.match(/answer_(\d+)/);
            if (m) return m[1];
        }
        // 3. Quét toàn bộ HTML của row
        const rowHtml = row.innerHTML;
        const match = rowHtml.match(/InputScore\((\d+)\)/) || 
                      rowHtml.match(/ChooseAnswerCheckIn\((\d+)/) ||
                      rowHtml.match(/RefreshScore\((\d+)\)/) || 
                      rowHtml.match(/RefreshSign\((\d+)\)/) ||
                      rowHtml.match(/MoveToOldRoom\((\d+)\)/) ||
                      rowHtml.match(/RequestCheckIn\((\d+)\)/) ||
                      rowHtml.match(/CheckOutSectionNoScore\((\d+)/) ||
                      rowHtml.match(/scoreWrap_(\d+)/);
        if (match && match[1]) return match[1];
        return null;
    }

    // Chèn giao diện nhập điểm inline cho từng dòng môn thường
    function injectInlineScoreUI(table) {
        if (!table) return;
        const tbody = table.querySelector("tbody");
        if (!tbody) return;

        const rows = tbody.querySelectorAll("tr");
        if (rows.length === 0) return;

        rows.forEach(row => {
            // Nếu là dòng của Dự án tốt nghiệp -> giữ nguyên cấu trúc cũ
            if (isDATNRow(row, table)) return;

            // Nếu sinh viên đã ký -> ẩn ô nhập điểm & nút Lưu
            const rowText = (row.innerText || "").toLowerCase();
            const signWrap = row.querySelector('[id^="signWrap_"]');
            const signText = signWrap ? (signWrap.innerText || "").toLowerCase() : "";
            const isSigned = rowText.includes("đã ký") || signText.includes("đã ký");

            let tdScore = row.querySelector(".e360-col-score-td");
            if (isSigned) {
                if (tdScore) {
                    const existingWrap = tdScore.querySelector(".e360-inline-score-wrap");
                    if (existingWrap) existingWrap.remove();
                }
                return;
            }

            const studentId = getStudentIdFromRow(row);
            if (!studentId) return;

            // Đảm bảo tdScore tồn tại ở cuối row
            if (!tdScore) {
                tdScore = row.querySelector(".e360-col-score-td");
            }
            if (!tdScore) {
                tdScore = document.createElement("td");
                tdScore.className = "text-center e360-custom-col e360-col-score-td";
                row.appendChild(tdScore);
            }

            // Lấy điểm hiện tại nếu có
            let currentScore = "";
            const scoreElem = row.querySelector('[id^="scoreWrap_"]');
            if (scoreElem) {
                const s = scoreElem.innerText.trim();
                if (s && s.toUpperCase() !== "N/A" && s !== "...") {
                    currentScore = s;
                }
            } else {
                const textMatch = row.innerText.match(/(?:ASM|SPEAKING|EOS)[:\s]*([\d\.]+)/i);
                if (textMatch && textMatch[1]) {
                    currentScore = textMatch[1];
                }
            }

            // Nếu đã chèn rồi trong tdScore, kiểm tra xem có cần đồng bộ giá trị không
            const existingWrap = tdScore.querySelector(".e360-inline-score-wrap");
            if (existingWrap) {
                // Không tự động fill lại giá trị vào input khi điểm thay đổi
                // (ví dụ giám thị 2 nhập điểm) — giữ nguyên giá trị người dùng đang nhập.
                return;
            }

            // Tạo container nhập điểm inline
            const wrap = document.createElement("div");
            wrap.className = "e360-inline-score-wrap";
            wrap.innerHTML = `
                <div class="e360-inline-score-row">
                    <input type="text" class="e360-score-input" data-id="${studentId}" value="${currentScore}" placeholder="Điểm" title="Nhập điểm (0 - 10) rồi bấm Lưu hoặc Enter" maxlength="4">
                    <button type="button" class="e360-btn-x2" data-id="${studentId}" title="Nhân đôi điểm (x2)">×2</button>
                    <button type="button" class="e360-btn-save" data-id="${studentId}" title="Lưu điểm (hoặc nhấn Enter)">Lưu</button>
                </div>
                <div class="e360-score-status" data-id="${studentId}"></div>
            `;

            tdScore.appendChild(wrap);

            const input = wrap.querySelector(".e360-score-input");
            const btnSave = wrap.querySelector(".e360-btn-save");
            const btnX2 = wrap.querySelector(".e360-btn-x2");
            const statusDiv = wrap.querySelector(".e360-score-status");

            // Nút x2 điểm: nhân đôi giá trị trong ô input
            if (btnX2) {
                btnX2.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Lấy điểm từ cột "Điểm" (scoreElem) để nhân đôi
                    let baseScore = "";
                    if (scoreElem) {
                        const s = (scoreElem.innerText || "").trim();
                        if (s && s.toUpperCase() !== "N/A" && s !== "..." && s !== "") {
                            baseScore = s;
                        }
                    }
                    if (!baseScore) {
                        baseScore = input.value.trim();
                    }
                    const num = parseFloat(String(baseScore).replace(",", "."));
                    if (isNaN(num)) {
                        input.value = "";
                        input.focus();
                        return;
                    }
                    let doubled = num * 2;
                    if (doubled > 10) doubled = 10;
                    input.value = doubled.toFixed(1);
                    input.classList.remove("error-shake");
                    input.focus();
                };
            }

            // Hàm thực hiện lưu điểm
            const doSave = () => {
                const rawVal = input.value.trim().replace(",", ".");
                if (rawVal === "") {
                    alert("⚠️ Vui lòng nhập điểm!");
                    input.focus();
                    return;
                }

                const scoreNum = parseFloat(rawVal);
                if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
                    alert("⚠️ Điểm không hợp lệ! Vui lòng nhập từ 0 đến 10.");
                    input.classList.add("error-shake");
                    input.focus();
                    return;
                }

                input.classList.remove("error-shake");
                btnSave.disabled = true;
                input.disabled = true;
                const origBtnText = btnSave.innerText;
                btnSave.innerText = "...";

                statusDiv.className = "e360-score-status loading";
                statusDiv.innerText = "⏳ Đang lưu...";

                saveScoreViaIframe(studentId, rawVal, (success, msg) => {
                    btnSave.disabled = false;
                    input.disabled = false;
                    btnSave.innerText = origBtnText;

                    if (success) {
                        statusDiv.className = "e360-score-status success";
                        statusDiv.innerText = "✅ Đã lưu";
                        // Giữ điểm trong ô input sau khi lưu
                        input.value = rawVal;
                        input.classList.add("saved-flash");
                        setTimeout(() => input.classList.remove("saved-flash"), 2000);

                        // Cập nhật thẻ hiển thị điểm trong cell nếu có
                        if (scoreElem) {
                            scoreElem.innerText = rawVal;
                        }

                        // Đồng bộ lưu vết storage để các panel / tab khác nhận biết
                        try {
                            localStorage.setItem("e360_score_updated", JSON.stringify({
                                itemId: parseInt(studentId, 10),
                                score: rawVal,
                                ts: Date.now()
                            }));
                        } catch (err) {}

                        // Tự ẩn thông báo trạng thái sau 3s
                        setTimeout(() => {
                            if (statusDiv.innerText === "✅ Đã lưu") {
                                statusDiv.className = "e360-score-status";
                                statusDiv.innerText = "";
                            }
                        }, 3000);
                    } else {
                        statusDiv.className = "e360-score-status error";
                        statusDiv.innerText = "❌ " + (msg || "Lỗi lưu");
                        input.classList.add("error-shake");
                    }
                });
            };

            // Sự kiện click nút Lưu
            btnSave.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                doSave();
            };

            // Sự kiện gõ phím Enter trên ô input
            input.onkeydown = (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    doSave();
                }
            };

            input.oninput = () => {
                input.classList.remove("error-shake");
            };

            // Guard cho auto-double: đánh dấu đang chỉnh sửa để không bị ghi đè khi reload
            input.addEventListener("focus", () => {
                try { window.__e360Editing = window.__e360Editing || {}; window.__e360Editing[studentId] = Infinity; } catch (e) { }
            });
            input.addEventListener("blur", () => {
                try {
                    window.__e360Editing = window.__e360Editing || {};
                    window.__e360Editing[studentId] = Date.now() + 3000;
                } catch (e) { }
            });
        });
    }

    // Phát hiện số giám thị hiện tại từ sidebar (GT:1 / GT:2)
    function getCurrentGTNumber() {
        try {
            const sidebar = document.querySelector(".sidebar-menu, .main-sidebar, body");
            const text = sidebar ? (sidebar.innerText || "") : (document.body.innerText || "");
            const m = text.match(/GT[:\s]*(\d+)/i);
            if (m) return parseInt(m[1], 10);
        } catch (e) { }
        return null;
    }

    // Tự động điền + lưu điểm x2 khi phát hiện điểm giám thị khác thay đổi (fake real-time)
    // Chỉ GT2 tự động (GT1 nhập → GT2 auto lưu ×2)
    function autoDoubleScore(table) {
        if (!table) return;
        const currentGT = getCurrentGTNumber();
        if (currentGT !== 2) return;
        const tbody = table.querySelector("tbody");
        if (!tbody) return;

        const rows = tbody.querySelectorAll("tr");
        rows.forEach(row => {
            if (row.querySelector(".dataTables_empty")) return;
            if (isDATNRow(row, table)) return;

            const studentId = getStudentIdFromRow(row);
            if (!studentId) return;

            const scoreElem = row.querySelector('[id^="scoreWrap_"]');
            if (!scoreElem) return;

            const baseScoreText = (scoreElem.innerText || "").trim();
            if (!baseScoreText || baseScoreText.toUpperCase() === "N/A" || baseScoreText === "...") return;

            const baseNum = parseFloat(baseScoreText.replace(",", "."));
            if (isNaN(baseNum) || baseNum < 0 || baseNum > 5) return;

            // Guard 1: đã xử lý base score này rồi thì bỏ qua (tránh lặp)
            const guardKey = "e360_autodouble_last_" + studentId;
            const lastBase = localStorage.getItem(guardKey);
            if (lastBase === baseScoreText) return;

            // Guard 2: nếu scoreElem đang là giá trị chúng ta đã tự lưu (×2) thì bỏ qua
            const savedKey = "e360_autodouble_saved_" + studentId;
            const lastSaved = localStorage.getItem(savedKey);
            if (lastSaved === baseScoreText) return;

            // Tìm tdScore & input
            let tdScore = row.querySelector(".e360-col-score-td");
            if (!tdScore) return;
            const input = tdScore.querySelector(".e360-score-input");
            const statusDiv = tdScore.querySelector(".e360-score-status");
            if (!input) return;

            // Nếu người dùng đang gõ thì không tự động
            if (document.activeElement === input) return;

            // Guard: nếu vừa chỉnh sửa ô này trong 3s qua thì không tự động (tránh ghi đè khi reload)
            try {
                const editingUntil = (window.__e360Editing && window.__e360Editing[studentId]) || 0;
                if (editingUntil > Date.now()) return;
            } catch (e) { }

            // Chỉ tự động nếu ô input đang trống (chưa nhập)
            if (input.value.trim() !== "") return;

            const doubled = Math.min(10, baseNum * 2);
            input.value = doubled.toFixed(1);

            // Lưu qua iframe
            saveScoreViaIframe(studentId, doubled.toFixed(1), (success, msg) => {
                if (success) {
                    if (statusDiv) {
                        statusDiv.className = "e360-score-status success";
                        statusDiv.innerText = "✅ Tự động lưu x2";
                    }
                    input.classList.add("saved-flash");
                    setTimeout(() => input.classList.remove("saved-flash"), 2000);
                    try {
                        localStorage.setItem("e360_score_updated", JSON.stringify({
                            itemId: parseInt(studentId, 10),
                            score: doubled.toFixed(1),
                            ts: Date.now()
                        }));
                        localStorage.setItem(savedKey, doubled.toFixed(1));
                    } catch (e) { }
                    setTimeout(() => {
                        if (statusDiv && statusDiv.innerText === "✅ Tự động lưu x2") {
                            statusDiv.className = "e360-score-status";
                            statusDiv.innerText = "";
                        }
                    }, 3000);
                } else {
                    if (statusDiv) {
                        statusDiv.className = "e360-score-status error";
                        statusDiv.innerText = "❌ " + (msg || "Lỗi lưu");
                    }
                }
            });

            // Đánh dấu đã xử lý base score này
            try { localStorage.setItem(guardKey, baseScoreText); } catch (e) { }
        });
        updateBulkSignButtonState(table);
    }

    // Cập nhật trạng thái nút "Ký tất cả" (chỉ bật khi tất cả SV đã có điểm)
    function updateBulkSignButtonState(table) {
        if (!table) return;
        const tbody = table.querySelector("tbody");
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll("tr")).filter(r => !r.querySelector(".dataTables_empty"));
        let allScored = true;
        let hasUnsigned = false;
        rows.forEach(row => {
            if (isDATNRow(row, table)) return;
            const tdScore = row.querySelector(".e360-col-score-td");
            const input = tdScore ? tdScore.querySelector(".e360-score-input") : null;
            const scoreElem = row.querySelector('[id^="scoreWrap_"]');
            let hasScore = false;
            if (input && input.value.trim() !== "") hasScore = true;
            else if (scoreElem) {
                const s = (scoreElem.innerText || "").trim();
                if (s && s.toUpperCase() !== "N/A" && s !== "..." && s !== "") hasScore = true;
            }
            if (!hasScore) allScored = false;
            const text = (row.innerText || "").toLowerCase();
            if (!text.includes("đã ký")) hasUnsigned = true;
        });
        const btns = table.querySelectorAll(".e360-bulk-sign-btn");
        btns.forEach(btn => {
            btn.disabled = !(allScored && hasUnsigned && rows.length > 0);
        });
    }

    // Ký hàng loạt tất cả SV chưa ký (chỉ khi tất cả đã có điểm)
    function bulkSignAll(table) {
        if (!table) return;
        const tbody = table.querySelector("tbody");
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll("tr")).filter(r => !r.querySelector(".dataTables_empty"));

        // Kiểm tra tất cả đã có điểm
        let allScored = true;
        rows.forEach(row => {
            if (isDATNRow(row, table)) return;
            const tdScore = row.querySelector(".e360-col-score-td");
            const input = tdScore ? tdScore.querySelector(".e360-score-input") : null;
            const scoreElem = row.querySelector('[id^="scoreWrap_"]');
            let hasScore = false;
            if (input && input.value.trim() !== "") hasScore = true;
            else if (scoreElem) {
                const s = (scoreElem.innerText || "").trim();
                if (s && s.toUpperCase() !== "N/A" && s !== "..." && s !== "") hasScore = true;
            }
            if (!hasScore) allScored = false;
        });
        if (!allScored) {
            alert("⚠️ Chỉ được ký hàng loạt khi tất cả sinh viên đã có điểm!");
            return;
        }

        const unsignedRows = rows.filter(row => {
            const text = (row.innerText || "").toLowerCase();
            return !text.includes("đã ký");
        });
        if (unsignedRows.length === 0) {
            alert("✅ Tất cả sinh viên đã ký.");
            return;
        }

        // Tạm override confirm để tự động đồng ý
        const origConfirm = window.confirm;
        window.confirm = () => true;
        const origDialog = window.e360DialogConfirm;
        if (window.e360DialogConfirm) window.e360DialogConfirm = () => Promise.resolve(true);

        let idx = 0;
        function signNext() {
            if (idx >= unsignedRows.length) {
                window.confirm = origConfirm;
                if (origDialog) window.e360DialogConfirm = origDialog;
                updateBulkSignButtonState(table);
                return;
            }
            const row = unsignedRows[idx++];
            const sigContainer = row.querySelector(".e360-signature-container");
            const cb = sigContainer ? sigContainer.querySelector('input[type="checkbox"]') : row.querySelector('input[type="checkbox"]');
            if (cb) {
                if (!cb.checked) cb.checked = true;
                cb.click();
                cb.dispatchEvent(new Event("change", { bubbles: true }));
            } else {
                const btn = Array.from(row.querySelectorAll("a,button")).find(b => (b.innerText || "").includes("Ký"));
                if (btn) btn.click();
            }
            setTimeout(signNext, 500);
        }
        signNext();
    }

    function forceLightChrome() {
        try {
            var targets = [
                '.main-header',
                '.main-header .navbar',
                '.main-header .logo',
                '.main-sidebar',
                '.main-sidebar .sidebar',
                '.left-side',
                'aside.main-sidebar',
                'section.sidebar'
            ];
            targets.forEach(function (sel) {
                document.querySelectorAll(sel).forEach(function (el) {
                    var bg = (sel.indexOf('logo') !== -1) ? '#f9fafb' : '#ffffff';
                    el.style.setProperty('background', bg, 'important');
                    el.style.setProperty('background-color', bg, 'important');
                    if (sel === '.main-header' || sel === '.main-header .navbar' || sel === '.main-header .logo') {
                        el.style.setProperty('height', '40px', 'important');
                        el.style.setProperty('min-height', '40px', 'important');
                        el.style.setProperty('line-height', '40px', 'important');
                    }
                });
            });

            // Padding top cho sidebar
            document.querySelectorAll('.main-sidebar, .left-side, aside.main-sidebar').forEach(function (el) {
                el.style.setProperty('padding-top', '60px', 'important');
            });

            // Header text/icon màu tối trên nền trắng
            document.querySelectorAll('.main-header, .main-header a, .main-header .fa, .main-header i').forEach(function (el) {
                if (!el.classList.contains('btn') || el.classList.contains('e360-theme-toggle')) {
                    el.style.setProperty('color', '#1d1d1f', 'important');
                }
            });

            // Ép màu chữ sidebar tối để nhìn thấy trên nền trắng
            document.querySelectorAll('.sidebar-menu li, .sidebar-menu li a, .sidebar-menu li.header').forEach(function (el) {
                el.style.setProperty('color', '#1d1d1f', 'important');
            });
            document.querySelectorAll('.sidebar-menu li a i, .sidebar-menu li a i.fa').forEach(function (el) {
                el.style.setProperty('color', '#86868b', 'important');
            });
            document.querySelectorAll('.sidebar-menu li.active a, .sidebar-menu li.active a i').forEach(function (el) {
                el.style.setProperty('color', '#ffffff', 'important');
                el.style.setProperty('background', '#0071e3', 'important');
                el.style.setProperty('background-color', '#0071e3', 'important');
            });
            // Xóa inline background xanh đậm nếu adminlte set
            document.querySelectorAll('.main-sidebar, .left-side, .main-header, .main-header .navbar, .main-header .logo').forEach(function (el) {
                if (el.style.backgroundColor && el.style.backgroundColor.indexOf('36,') !== -1) {
                    el.style.removeProperty('background-color');
                }
            });
        } catch (e) { }
    }

    function init() {
        // Ép tone sáng cho header/sidebar ngay lập tức
        forceLightChrome();
        // Đợi 500ms để đảm bảo JS của website đã chạy xong
        setTimeout(() => {
            forceLightChrome();
            const table = document.getElementById(TABLE_ID);
            const scheduleTable = document.getElementById("scheduleTable");

            // Xử lý bảng lịch bảo vệ (độc lập với bảng điểm)
            if (scheduleTable) {
                processScheduleTable();
                
                // Theo dõi thay đổi trong scheduleTable
                const scheduleTbody = scheduleTable.querySelector("tbody");
                if (scheduleTbody) {
                    const scheduleObserver = new MutationObserver(() => {
                        processScheduleTable();
                    });
                    scheduleObserver.observe(scheduleTbody, { childList: true, subtree: true });
                }
            }

            // Theo dõi thay đổi class trên body (theme panel) để giữ tone sáng
            try {
                var bodyObserver = new MutationObserver(function () { forceLightChrome(); });
                bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
            } catch (e) { }

            // Theo dõi liên tục để AdminLTE/theme không ghi đè lại màu
            try {
                var persistDebounce = null;
                var persistObserver = new MutationObserver(function () {
                    clearTimeout(persistDebounce);
                    persistDebounce = setTimeout(function () { forceLightChrome(); }, 120);
                });
                persistObserver.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
            } catch (e) { }

            // Giữ style liên tục (AdminLTE có thể set inline sau load)
            setInterval(function () { forceLightChrome(); }, 800);

            // Nếu không có bảng điểm thì dừng phần xử lý bảng điểm
            if (!table) return;

            // Tái cấu trúc các cột (tách Chữ ký & Nhập điểm ra 2 cột riêng ở cuối)
            reorganizeTableColumns(table);

            // Đảm bảo cột Chữ ký & Nhập điểm luôn hiển thị (không bị ẩn do state cũ)
            try {
                table.querySelectorAll('.e360-col-signature-th, .e360-col-signature-td, .e360-col-score-th, .e360-col-score-td').forEach(function (el) {
                    el.style.display = '';
                });
            } catch (e) { }

            const state = loadState();

            // Inject buttons
            injectButtons(table, state);

            // Áp dụng trạng thái đã lưu cho tất cả rows hiện có
            applyStateToAllRows(table, state);

            // Inject header toggle button
            injectHeaderToggle();

            // Inject sidebar toggle button
            injectSidebarToggle();

            // Tạo panel điều hướng nhanh
            createQuickNavPanel(table);

            // Chuyển đổi radio điểm danh thành Apple Cupertino Segmented Switch
            transformCheckInToSegmentedSwitch(table);

            // Chèn UI nhập điểm inline cho các môn thường (không phải DATN)
            injectInlineScoreUI(table);

            // Cập nhật trạng thái nút Ký tất cả
            updateBulkSignButtonState(table);

            // Tự động điền + lưu điểm x2 khi phát hiện điểm giám thị khác thay đổi (fake real-time)
            autoDoubleScore(table);

            // Theo dõi thay đổi trong tbody để áp dụng lại state và refresh panel khi có rows mới
            const tbody = table.querySelector("tbody");
            if (tbody) {
                let debounceTimer = null;
                const observer = new MutationObserver(() => {
                    // Debounce để tránh gọi quá nhiều lần
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        reorganizeTableColumns(table); // Cập nhật cột Chữ ký & Nhập điểm
                        applyStateToAllRows(table, loadState());
                        transformCheckInToSegmentedSwitch(table); // Cập nhật switch điểm danh
                        createQuickNavPanel(table); // Refresh panel
                        processScheduleTable(); // Refresh schedule colors
                        injectInlineScoreUI(table); // Refresh inline score UI
                        updateBulkSignButtonState(table); // Cập nhật nút Ký tất cả
                        autoDoubleScore(table); // Tự động điền + lưu điểm x2
                    }, 300);
                });

                observer.observe(tbody, {
                    childList: true,
                    subtree: true
                });
            }

            console.log("[E360-VUI] Extension loaded. State:", state);
        }, 500);
    }

    // ==================== SCORE INPUT PANEL ====================

    function isInputScorePage() {
        const href = window.location.href;
        return href.includes("/Proctor/InputScore") || 
               href.includes("/CommitteeMember/InputScore") ||
               href.includes("/CommitteeMember/InputScoreDetail");
    }

    function createScoreInputPanel() {
        const scoreTable = document.getElementById("tblScore");
        if (!scoreTable) return;

        // Xóa panel cũ nếu có
        const oldPanel = document.getElementById("score-input-panel");
        if (oldPanel) oldPanel.remove();

        // Lấy danh sách tiêu chí từ bảng
        const rows = scoreTable.querySelectorAll("tbody tr:not([style*='background'])");
        if (rows.length === 0) return;

        // Tìm các lệch điểm IAP
        const iapDiscrepancies = [];
        const alerts = document.querySelectorAll(".alert-danger");
        alerts.forEach(alert => {
            const text = alert.innerText;
            const match = text.match(/Điểm phần (.*?) đang lệch.*?so với điểm IAP ([\d.]+)/);
            if (match) {
                iapDiscrepancies.push({
                    sectionName: match[1].trim(),
                    score: parseFloat(match[2])
                });
            }
        });

        const criteria = [];
        rows.forEach(row => {
            const scoreInput = row.querySelector("input.score-input");
            if (!scoreInput) return;

            criteria.push({
                name: row.cells[2]?.innerText?.trim() || "Tiêu chí",
                weight: parseFloat(scoreInput.dataset.weight) || 0,
                inputElement: scoreInput,
                itemId: scoreInput.dataset.itemid,
                criteriaType: scoreInput.dataset.criteriatype
            });
        });

        if (criteria.length === 0) return;

        const hasDATNSections = criteria.some(c => c.criteriaType === "NHOM" || c.criteriaType === "CANHAN" || c.criteriaType === "TAILIEUDUAN");

        // Tạo panel
        const panel = document.createElement("div");
        panel.id = "score-input-panel";
        panel.className = "premium-panel";
        panel.innerHTML = `
            <div id="score-panel-header" class="panel-header">
                <span>🎯 Nhập điểm nâng cao</span>
                <div id="score-panel-actions">
                    <button id="score-panel-minimize" class="panel-btn" title="Thu nhỏ">_</button>
                    <button id="score-panel-close" class="panel-btn">✕</button>
                </div>
            </div>
            <div id="score-panel-content" class="panel-content">
                ${iapDiscrepancies.length > 0 ? `
                    <div id="iap-quick-fixes" class="iap-container">
                        <div class="iap-title">🛠 Khớp điểm IAP (Tài liệu):</div>
                        ${iapDiscrepancies.map((fix, idx) => `
                            <div class="iap-fix-row" style="display: flex; gap: 5px; margin-top: 5px;">
                                <input type="number" class="iap-custom-score" value="${fix.score}" step="0.1" min="0" max="10" 
                                       style="width: 50px; padding: 4px; border-radius: 4px; border: 1px solid #10b981; font-weight: bold;">
                                <button class="iap-fix-btn" data-section="${fix.sectionName}" style="flex: 1; margin-top: 0; padding: 6px;">
                                    ✅ Đặt <b>${fix.sectionName}</b>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${hasDATNSections ? `
                <div class="section-fill-container" style="margin-bottom: 20px; padding: 12px; background: #eff6ff; border: 1px solid #3b82f6; border-radius: 12px;">
                    <div class="iap-title" style="color: #1e40af;">🚀 Nhập nhanh các phần khác:</div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                        <input type="number" id="section-fill-score" value="8" step="0.1" min="0" max="10" 
                               style="width: 50px; padding: 6px; border-radius: 6px; border: 1px solid #3b82f6; font-weight: bold; text-align: center;">
                        <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                            <button class="section-fill-btn" data-type="NHOM" style="padding: 6px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">👥 Nhập phần Nhóm</button>
                            <button class="section-fill-btn" data-type="CANHAN" style="padding: 6px; background: #1e40af; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">👤 Nhập phần Cá nhân</button>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div id="score-total-row" class="total-row">
                    <div class="bulk-fill-group">
                        <label>Bulk (tất cả):</label>
                        <input type="number" id="score-total-input" min="0" max="10" step="0.1" placeholder="0-10">
                        <button id="score-distribute-btn" class="fill-btn">Fill</button>
                    </div>
                </div>

                <div id="bulk-paste-container" class="paste-container">
                    <button id="toggle-paste-btn" class="toggle-btn">📋 Dán danh sách điểm</button>
                    <div id="paste-area-wrapper" class="paste-wrapper" style="display: none;">
                        <textarea id="bulk-paste-area" placeholder="Dán dãy điểm (cách nhau bởi khoảng trắng hoặc xuống dòng)"></textarea>
                        <button id="apply-paste-btn" class="apply-btn">Áp dụng</button>
                    </div>
                </div>

                <div id="score-sliders-container" class="sliders-container"></div>
            </div>
        `;

        document.body.appendChild(panel);

        const header = panel.querySelector("#score-panel-header");

        // Nút đóng và thu nhỏ
        const closeBtn = panel.querySelector("#score-panel-close");
        const minimizeBtn = panel.querySelector("#score-panel-minimize");
        
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            panel.remove();
        };

        minimizeBtn.onclick = (e) => {
            e.stopPropagation();
            const content = panel.querySelector("#score-panel-content");
            if (content.style.display === "none") {
                content.style.display = "block";
                minimizeBtn.textContent = "_";
                panel.style.width = "320px";
            } else {
                content.style.display = "none";
                minimizeBtn.textContent = "□";
                panel.style.width = "150px";
            }
        };

        // Style content
        const content = panel.querySelector("#score-panel-content");
        Object.assign(content.style, {
            padding: "12px",
            maxHeight: "400px",
            overflowY: "auto"
        });

        // Style total row
        const totalRow = panel.querySelector("#score-total-row");
        Object.assign(totalRow.style, {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "15px",
            padding: "10px",
            background: "#FFF3E0",
            borderRadius: "6px"
        });

        const totalInput = panel.querySelector("#score-total-input");
        Object.assign(totalInput.style, {
            width: "80px",
            padding: "6px",
            border: "1px solid #FF9800",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "bold"
        });

        // Tự động gọi hành vi bấm nút "Vào bảng" khi ô input mất focus
        totalInput.onblur = () => {
            distributeBtn.click();
        };

        const distributeBtn = panel.querySelector("#score-distribute-btn");
        Object.assign(distributeBtn.style, {
            padding: "6px 12px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
        });

        // Xử lý dán hàng loạt
        const togglePasteBtn = panel.querySelector("#toggle-paste-btn");
        const pasteAreaWrapper = panel.querySelector("#paste-area-wrapper");
        const bulkPasteArea = panel.querySelector("#bulk-paste-area");
        const applyPasteBtn = panel.querySelector("#apply-paste-btn");

        togglePasteBtn.onclick = () => {
            pasteAreaWrapper.style.display = pasteAreaWrapper.style.display === "none" ? "block" : "none";
        };

        applyPasteBtn.onclick = () => {
            const text = bulkPasteArea.value.trim();
            if (!text) return;

            // Tách các con số bằng khoảng trắng, dấu phẩy hoặc xuống dòng
            const scores = text.split(/[\s,]+/).map(s => parseFloat(s.replace(',', '.')));
            
            scores.forEach((score, i) => {
                if (i < criteria.length && !isNaN(score)) {
                    updateSliderValue(i, score);
                }
            });
            
            updateTotalDisplay();
            pasteAreaWrapper.style.display = "none";
        };

        // Xử lý fix IAP
        panel.querySelectorAll(".iap-fix-btn").forEach(btn => {
            btn.onclick = () => {
                const section = btn.dataset.section;
                const scoreInput = btn.parentElement.querySelector(".iap-custom-score");
                const score = parseFloat(scoreInput.value);
                
                if (isNaN(score) || score < 0 || score > 10) {
                    alert("Vui lòng nhập điểm hợp lệ (0-10)");
                    return;
                }
                
                criteria.forEach((item, i) => {
                    let match = false;
                    const cType = item.criteriaType;
                    
                    if (section === "TÀI LIỆU DỰ ÁN" && cType === "TAILIEUDUAN") match = true;
                    if (section === "Nhóm" && cType === "NHOM") match = true;
                    if (section === "Cá nhân" && cType === "CANHAN") match = true;
                    if (!match && item.name.includes(section)) match = true;

                    if (match) {
                        updateSliderValue(i, score);
                    }
                });
                
                updateTotalDisplay();
            };
        });

        // Xử lý nhập nhanh các phần
        panel.querySelectorAll(".section-fill-btn").forEach(btn => {
            btn.onclick = () => {
                const type = btn.dataset.type;
                const scoreInput = panel.querySelector("#section-fill-score");
                const score = parseFloat(scoreInput.value);

                if (isNaN(score) || score < 0 || score > 10) {
                    alert("Vui lòng nhập điểm hợp lệ (0-10)");
                    return;
                }

                criteria.forEach((item, i) => {
                    if (item.criteriaType === type) {
                        updateSliderValue(i, score);
                    }
                });

                updateTotalDisplay();
            };
        });

        // Container cho sliders
        const slidersContainer = panel.querySelector("#score-sliders-container");

        // Track các slider đã được kéo (locked)
        const lockedSliders = new Set();
        let currentTotal = 0; // Tổng điểm hiện tại

        // Hàm tính tổng điểm từ sliders
        function calculateTotal() {
            let total = 0;
            criteria.forEach((item, i) => {
                const slider = slidersContainer.querySelectorAll(".score-slider")[i];
                const score = parseFloat(slider.value) || 0;
                total += score * (item.weight / 100);
            });
            return total;
        }

        // Hàm cập nhật hiển thị tổng điểm
        function updateTotalDisplay() {
            currentTotal = calculateTotal();
            totalInput.value = currentTotal.toFixed(1);
        }

        // Hàm redistribute điểm cho các slider chưa lock
        function redistributeUnlockedSliders(changedIndex) {
            const targetTotal = currentTotal; // Giữ nguyên tổng cố định

            // Tính điểm đóng góp từ các slider đã lock (bao gồm slider vừa kéo)
            let lockedContribution = 0;
            let unlockedWeight = 0;

            criteria.forEach((item, i) => {
                const slider = slidersContainer.querySelectorAll(".score-slider")[i];
                const score = parseFloat(slider.value) || 0;

                if (lockedSliders.has(i)) {
                    lockedContribution += score * (item.weight / 100);
                } else {
                    unlockedWeight += item.weight;
                }
            });

            // Điểm còn lại cho các slider chưa lock
            const remainingScore = targetTotal - lockedContribution;

            // Nếu không còn slider nào unlocked
            if (unlockedWeight === 0) {
                // Tổng có thể bị vượt quá targetTotal - hiển thị tổng thực tế
                totalInput.value = calculateTotal().toFixed(1);
                return;
            }

            // Tính điểm cần thiết cho mỗi slider unlocked
            const newScoreForUnlocked = (remainingScore * 100) / unlockedWeight;

            // Clamp giữa 0 và 10
            const clampedScore = Math.max(0, Math.min(10, newScoreForUnlocked));

            // Cập nhật các slider unlocked
            criteria.forEach((item, i) => {
                if (!lockedSliders.has(i)) {
                    const slider = slidersContainer.querySelectorAll(".score-slider")[i];
                    const valueInput = slidersContainer.querySelectorAll(".score-value")[i];

                    slider.value = clampedScore.toFixed(1);
                    valueInput.value = clampedScore.toFixed(1);
                    item.inputElement.value = clampedScore.toFixed(1);
                    item.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                    item.inputElement.dispatchEvent(new Event("change", { bubbles: true }));
                }
            });

            // Hiển thị tổng đã tính (có thể khác targetTotal nếu clamp xảy ra)
            totalInput.value = calculateTotal().toFixed(1);
        }

        // Hàm cập nhật một slider và ô điểm trong bảng
        function updateSliderValue(index, value) {
            const item = criteria[index];
            const slider = slidersContainer.querySelectorAll(".score-slider")[index];
            const valueInput = slidersContainer.querySelectorAll(".score-value")[index];

            slider.value = value;
            valueInput.value = parseFloat(value).toFixed(1);
            item.inputElement.value = parseFloat(value).toFixed(1);
            item.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
            item.inputElement.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // Tạo sliders cho từng tiêu chí
        criteria.forEach((item, index) => {
            const sliderRow = document.createElement("div");
            sliderRow.style.cssText = "margin-bottom: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px; position: relative;";

            sliderRow.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span class="criterion-name" style="font-weight: 500; color: #333;">${item.name}</span>
                    <div>
                        <span class="lock-indicator" style="color: #999; font-size: 10px; margin-right: 5px;"></span>
                        <span style="color: #666; font-size: 11px;">Trọng số: ${item.weight}%</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="range" class="score-slider" data-index="${index}" 
                           min="0" max="10" step="0.1" value="${item.inputElement.value || 0}"
                           style="flex: 1; cursor: pointer;">
                    <input type="number" class="score-value" data-index="${index}"
                           min="0" max="10" step="0.1" value="${item.inputElement.value || 0}"
                           style="width: 55px; text-align: center; padding: 4px; border: 1px solid #ccc; border-radius: 4px;">
                    <button class="unlock-btn" data-index="${index}" title="Mở khóa" 
                            style="padding: 2px 6px; font-size: 10px; cursor: pointer; border: 1px solid #ccc; border-radius: 3px; background: #fff; display: none;">🔓</button>
                </div>
            `;

            slidersContainer.appendChild(sliderRow);

            const slider = sliderRow.querySelector(".score-slider");
            const valueInput = sliderRow.querySelector(".score-value");
            const lockIndicator = sliderRow.querySelector(".lock-indicator");
            const unlockBtn = sliderRow.querySelector(".unlock-btn");

            // Cập nhật indicator
            function updateLockIndicator() {
                if (lockedSliders.has(index)) {
                    lockIndicator.textContent = "🔒";
                    sliderRow.style.background = "#fff3e0";
                    unlockBtn.style.display = "inline-block";
                } else {
                    lockIndicator.textContent = "";
                    sliderRow.style.background = "#f5f5f5";
                    unlockBtn.style.display = "none";
                }
            }

            // Unlock button
            unlockBtn.onclick = () => {
                lockedSliders.delete(index);
                updateLockIndicator();
            };

            slider.oninput = () => {
                const val = parseFloat(slider.value).toFixed(1);
                valueInput.value = val;
                item.inputElement.value = val;
                item.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                item.inputElement.dispatchEvent(new Event("change", { bubbles: true }));

                // Lock slider này
                lockedSliders.add(index);
                updateLockIndicator();

                // Redistribute các slider khác
                redistributeUnlockedSliders(index);
            };

            valueInput.oninput = () => {
                let val = parseFloat(valueInput.value);
                if (isNaN(val)) val = 0;
                if (val < 0) val = 0;
                if (val > 10) val = 10;
                slider.value = val;
                item.inputElement.value = val.toFixed(1);
                item.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                item.inputElement.dispatchEvent(new Event("change", { bubbles: true }));

                // Lock slider này
                lockedSliders.add(index);
                updateLockIndicator();

                // Redistribute các slider khác
                redistributeUnlockedSliders(index);
            };
        });

        // Hàm phân chia điểm tổng cho từng tiêu chí
        distributeBtn.onclick = () => {
            const totalScore = parseFloat(totalInput.value);
            if (isNaN(totalScore) || totalScore < 0 || totalScore > 10) {
                alert("Vui lòng nhập tổng điểm từ 0 đến 10");
                return;
            }

            // Reset tất cả locked sliders
            lockedSliders.clear();

            // Phân chia đều cho từng tiêu chí
            criteria.forEach((item, i) => {
                const slider = slidersContainer.querySelectorAll(".score-slider")[i];
                const valueInput = slidersContainer.querySelectorAll(".score-value")[i];
                const sliderRow = slider.closest("div[style*='margin-bottom']");
                const lockIndicator = sliderRow.querySelector(".lock-indicator");
                const unlockBtn = sliderRow.querySelector(".unlock-btn");

                slider.value = totalScore;
                valueInput.value = totalScore.toFixed(1);
                item.inputElement.value = totalScore.toFixed(1);
                item.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                item.inputElement.dispatchEvent(new Event("change", { bubbles: true }));

                // Reset UI
                lockIndicator.textContent = "";
                sliderRow.style.background = "#f5f5f5";
                unlockBtn.style.display = "none";
            });

            // Update currentTotal
            currentTotal = totalScore;
        };

        // Draggable
        let isDragging = false;
        let offsetX, offsetY;

        header.onmousedown = (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            header.style.cursor = "grabbing";
        };

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            header.style.cursor = "move";
        });

        // Khởi tạo tổng điểm từ giá trị hiện tại
        currentTotal = calculateTotal();
        totalInput.value = currentTotal.toFixed(1);

        console.log("[E360-VUI] Score Input Panel created with", criteria.length, "criteria, initial total:", currentTotal);
    }

    function initScorePage() {
        setTimeout(() => {
            createScoreInputPanel();
        }, 500);
    }


    // Chạy sau khi page load hoàn toàn
    function startExtension() {
        // Tránh chạy extension bên trong các iframe ẩn
        if (window.top !== window.self) return;

        forceLightChrome();

        if (isInputScorePage()) {
            initScorePage();
        } else {
            init();
        }
    }

    if (document.readyState === "complete") {
        startExtension();
    } else {
        window.addEventListener("load", startExtension);
    }
})();
