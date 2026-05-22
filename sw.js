<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>MedManager Pro</title>
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <style>
        :root { --primary: #007aff; --bg: #f2f2f7; --card: #ffffff; --border: #d1d1d6; }
        body { font-family: -apple-system, system-ui; background: var(--bg); margin: 0; padding-bottom: 100px; }
        
        /* 顶部固定栏 */
        .sticky-header { 
            position: sticky; top: 0; background: rgba(255,255,255,0.9); 
            backdrop-filter: blur(10px); z-index: 100; border-bottom: 0.5px solid var(--border);
            padding: 10px 15px;
        }
        .search-bar {
            width: 100%; border: none; background: #e3e3e8; padding: 8px 12px;
            border-radius: 10px; font-size: 16px; box-sizing: border-box; outline: none;
        }

        /* 视图切换按钮 */
        .view-tabs { display: flex; padding: 10px 15px; gap: 10px; }
        .tab { 
            flex: 1; padding: 8px; text-align: center; background: #ddd; 
            border-radius: 8px; font-size: 14px; cursor: pointer; 
        }
        .tab.active { background: var(--primary); color: white; }

        /* 卡片样式 */
        .patient-list { padding: 10px; }
        .card { 
            background: var(--card); border-radius: 12px; padding: 15px; margin-bottom: 12px; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
        }
        .card-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .bed-tag { background: #5856d6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        .dept-tag { color: var(--primary); font-size: 12px; font-weight: bold; }

        /* 表格样式 */
        .table-container { overflow-x: auto; background: white; margin: 10px; border-radius: 8px; display: none; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 600px; }
        th, td { border: 0.5px solid #eee; padding: 10px; text-align: left; }
        th { background: #f9f9f9; }

        /* 模态框 */
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 200; overflow-y: auto; }
        .modal-content { padding: 20px; }
        .grid-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .input-group { margin-bottom: 12px; }
        label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
        input, textarea, select { 
            width: 100%; border: 1px solid var(--border); border-radius: 8px; 
            padding: 10px; font-size: 16px; box-sizing: border-box; 
        }
        
        /* 底部导航 */
        .bottom-nav { 
            position: fixed; bottom: 0; width: 100%; background: white; 
            border-top: 0.5px solid var(--border); display: flex; 
            justify-content: space-around; padding: 10px 0; padding-bottom: 30px;
        }
        .add-btn { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; }
    </style>
</head>
<body>

<div class="sticky-header">
    <input type="text" id="searchInput" class="search-bar" placeholder="搜索姓名、床号、科室或诊断..." oninput="filterData()">
</div>

<div class="view-tabs">
    <div id="tabList" class="tab active" onclick="switchView('list')">卡片视图</div>
    <div id="tabTable" class="tab" onclick="switchView('table')">汇总表格</div>
</div>

<!-- 卡片列表视图 -->
<div id="listView" class="patient-list"></div>

<!-- 汇总表格视图 -->
<div id="tableView" class="table-container">
    <table>
        <thead>
            <tr>
                <th>床号</th><th>姓名</th><th>科室</th><th>诊断</th><th>入院日期</th><th>预计出院</th>
            </tr>
        </thead>
        <tbody id="tableBody"></tbody>
    </table>
</div>

<!-- 新增/编辑模态框 -->
<div id="modal" class="modal">
    <div class="modal-content">
        <h2 id="modalTitle">病人信息</h2>
        <div class="grid-inputs">
            <div class="input-group"><label>床号*</label><input type="text" id="bedNo"></div>
            <div class="input-group"><label>科室</label><input type="text" id="dept"></div>
        </div>
        <div class="grid-inputs">
            <div class="input-group"><label>姓名*</label><input type="text" id="name"></div>
            <div class="input-group"><label>年龄/ID</label><input type="text" id="ageId"></div>
        </div>
        <div class="input-group"><label>诊断</label><input type="text" id="diagnosis"></div>
        
        <div class="grid-inputs">
            <div class="input-group"><label>入院日期</label><input type="date" id="dateIn"></div>
            <div class="input-group"><label>预计出院</label><input type="date" id="datePre"></div>
        </div>
        <div class="input-group"><label>实际出院</label><input type="date" id="dateOut"></div>

        <div class="input-group"><label>目前用药</label><textarea id="meds"></textarea></div>
        <div class="input-group"><label>治疗计划</label><textarea id="plan"></textarea></div>
        <div class="input-group"><label>操作 / 手术</label><input type="text" id="procedure"></div>
        <div class="input-group"><label>待办事项</label><textarea id="todos"></textarea></div>
        
        <button class="add-btn" style="width:100%; margin-bottom:10px;" onclick="savePatient()">保存</button>
        <button class="add-btn" style="width:100%; background:#8e8e93;" onclick="closeModal()">取消</button>
        <button id="delBtn" style="width:100%; background:#ff3b30; color:white; border:none; padding:10px; margin-top:20px; border-radius:10px; display:none;" onclick="deletePatient()">删除记录</button>
    </div>
</div>

<div class="bottom-nav">
    <button class="add-btn" onclick="openModal()">＋ 新增病人</button>
</div>

<script>
    let patients = JSON.parse(localStorage.getItem('patients') || '[]');
    let currentEditIndex = -1;
    let currentView = 'list';

    function render() {
        const keyword = document.getElementById('searchInput').value.toLowerCase();
        const filtered = patients.filter(p => 
            p.name.toLowerCase().includes(keyword) || 
            p.bedNo.toLowerCase().includes(keyword) || 
            p.dept.toLowerCase().includes(keyword) ||
            p.diagnosis.toLowerCase().includes(keyword)
        );

        // 按床号排序
        filtered.sort((a, b) => a.bedNo.localeCompare(b.bedNo));

        renderList(filtered);
        renderTable(filtered);
    }

    function renderList(data) {
        const listDiv = document.getElementById('listView');
        listDiv.innerHTML = data.map((p, index) => `
            <div class="card" onclick="openModal(${patients.indexOf(p)})">
                <div class="card-row">
                    <span class="patient-name"><b>${p.name}</b> <small>${p.ageId}</small></span>
                    <span class="bed-tag">${p.bedNo} 床</span>
                </div>
                <div class="card-row">
                    <span class="dept-tag">${p.dept || '未填科室'}</span>
                    <span style="font-size:12px; color:#666;">入: ${p.dateIn || '-'}</span>
                </div>
                <div style="font-size:14px; margin-top:5px; color:#333;">诊: ${p.diagnosis}</div>
            </div>
        `).join('');
    }

    function renderTable(data) {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = data.map(p => `
            <tr>
                <td>${p.bedNo}</td>
                <td>${p.name}</td>
                <td>${p.dept}</td>
                <td>${p.diagnosis}</td>
                <td>${p.dateIn}</td>
                <td>${p.datePre}</td>
            </tr>
        `).join('');
    }

    function switchView(view) {
        currentView = view;
        document.getElementById('listView').style.display = view === 'list' ? 'block' : 'none';
        document.getElementById('tableView').style.display = view === 'table' ? 'block' : 'none';
        document.getElementById('tabList').className = 'tab' + (view === 'list' ? ' active' : '');
        document.getElementById('tabTable').className = 'tab' + (view === 'table' ? ' active' : '');
    }

    function filterData() { render(); }

    function openModal(index = -1) {
        currentEditIndex = index;
        document.getElementById('modal').style.display = 'block';
        const fields = ['bedNo','dept','name','ageId','diagnosis','dateIn','datePre','dateOut','meds','plan','procedure','todos'];
        if (index > -1) {
            const p = patients[index];
            fields.forEach(f => document.getElementById(f).value = p[f] || '');
            document.getElementById('delBtn').style.display = 'block';
        } else {
            fields.forEach(f => document.getElementById(f).value = '');
            document.getElementById('delBtn').style.display = 'none';
        }
    }

    function closeModal() { document.getElementById('modal').style.display = 'none'; }

    function savePatient() {
        const p = {};
        ['bedNo','dept','name','ageId','diagnosis','dateIn','datePre','dateOut','meds','plan','procedure','todos'].forEach(f => {
            p[f] = document.getElementById(f).value;
        });

        if (!p.name || !p.bedNo) return alert('姓名和床号必填');

        if (currentEditIndex > -1) patients[currentEditIndex] = p;
        else patients.push(p);

        localStorage.setItem('patients', JSON.stringify(patients));
        render();
        closeModal();
    }

    function deletePatient() {
        if (confirm('确认删除？')) {
            patients.splice(currentEditIndex, 1);
            localStorage.setItem('patients', JSON.stringify(patients));
            render();
            closeModal();
        }
    }

    // 初始渲染
    render();
</script>
</body>
</html>