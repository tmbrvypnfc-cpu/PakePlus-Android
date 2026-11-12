/**
 * 纯前端本地存储层 (基于 localStorage)
 * 无任何依赖，同步执行，永久保存在手机本地
 */
(function () {
  // 存储的主键名
  const STORAGE_KEY = "vocab_data";

  // 初始化（兼容你页面里的 await AppDB.init() 调用）
  async function init() {
    console.log("本地存储 (localStorage) 已就绪");
    // 确保存储字段存在，不存在则初始化空数组
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
  }

  // 获取所有数据
  function getAll() {
    const str = localStorage.getItem(STORAGE_KEY);
    return str ? JSON.parse(str) : [];
  }

  // 保存所有数据（内部使用）
  function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // 新增
  function add(eng, chi) {
    const data = getAll();
    // 生成自增 ID
    const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
    data.push({
      id: newId,
      eng: eng,
      chi: chi,
      studyTime: 0,
      createTime: new Date().toLocaleString()
    });
    saveAll(data);
  }

  // 更新
  function update(id, eng, chi) {
    const data = getAll();
    const item = data.find(d => d.id === id);
    if (item) {
      item.eng = eng;
      item.chi = chi;
      saveAll(data);
    }
  }

  // 删除
  function del(id) {
    let data = getAll();
    data = data.filter(d => d.id !== id);
    saveAll(data);
  }

  // 更新复习状态
  function updateStudy(id, type) {
    const data = getAll();
    const item = data.find(d => d.id === id);
    if (item) {
      if (type === 'know') item.studyTime = (item.studyTime || 0) + 1;
      if (type === 'forget') item.studyTime = 0;
      saveAll(data);
    }
  }

  // 导出为 JSON 字符串
  function exportJSON() {
    return JSON.stringify(getAll(), null, 2);
  }

  // 导入合并：ENG+CHI 匹配上就忽略/更新，匹配不上就新增
  function importJSON(jsonStr) {
    let importData;
    try {
      importData = JSON.parse(jsonStr);
      if (!Array.isArray(importData)) throw new Error("数据格式不正确，应为数组");
    } catch (e) {
      throw new Error("解析文件失败: " + e.message);
    }

    const currentData = getAll();
    let insertCount = 0;
    let updateCount = 0;

    importData.forEach(imp => {
      // 兼容老版本的大写字段 (ENG/CHI) 和新版本的小写字段 (eng/chi)
      const eng = imp.eng || imp.ENG;
      const chi = imp.chi || imp.CHI;

      if (!eng || !chi) return; // 跳过无效数据

      const exist = currentData.find(d => d.eng === eng && d.chi === chi);
      if (exist) {
        updateCount++;
      } else {
        const newId = currentData.length > 0 ? Math.max(...currentData.map(d => d.id)) + 1 : 1;
        currentData.push({
          id: newId,
          eng: eng,
          chi: chi,
          studyTime: 0,
          createTime: new Date().toLocaleString()
        });
        insertCount++;
      }
    });

    saveAll(currentData);
    return { insertCount, updateCount };
  }

  // 暴露给全局变量
  window.AppDB = {
    init,
    getAll,
    add,
    update,
    del,
    updateStudy,
    exportJSON,
    importJSON
  };
})();