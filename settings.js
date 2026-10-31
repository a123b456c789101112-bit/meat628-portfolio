/* 可調整的互動設定。位置、尺寸與牌子角度仍在 styles.css。 */
window.portfolioSettings = Object.freeze({
  renderCacheRevision: "ground-shared-edge-v1", // 草地／毛流來源版本；替換原稿時更新，避免重用舊快取。
  illustrationPage: Object.freeze({
    zoom: 1.04,             // 成品碰到／鍵盤聚焦時微放大 4%；外層版面固定。
    zoomMs: 180,            // 微放大與復位時間，單位毫秒。
    preloadPixels: 350,     // 距離畫面 350 像素才準備下一批作品。
    artworks: window.portfolioIllustrationPage,
    // 精選作品只在自己的燈箱顯示；正文照使用者提供，不補寫創作設定。
    featured: Object.freeze({
      "插圖27.PNG": Object.freeze({
        title: "萬聖節 × 聖誕節｜節日合體卡片",
        concept: "這件作品原先是為了交換卡片而創作，但因製作時間有限，於是將萬聖節與聖誕節結合在同一張卡片中，這張圖想融合兩種節日溫馨又詭異的氛圍，形成跨節日的創作主題。",
        sketches: Object.freeze([
          { src: "assets/optimized/90aa28981194d3af14c88b560ccac1785776c8e65ccea9076e982a5f74199846.webp", name: "插圖27 2.PNG", width: 1181, height: 1748 },
          { src: "assets/optimized/280f86a20dc386050a89e6f78926192742fd842ff314e3e99bcfbc4d636cc5af.webp", name: "插圖27 3.PNG", width: 1748, height: 1181 },
          { src: "assets/optimized/2940890933903fffc4d5db9de96fcfcb1d4fa763ed35242bebac073e0584d0da.webp", name: "插圖27.PNG", width: 1748, height: 1181, selected: true },
        ].map(Object.freeze)),
      }),
      "插圖51拷貝.jpg": Object.freeze({
        sketchesHeading: "創作過程",
        sketches: Object.freeze([
          {"src": "assets/generated/featured/process-714274e1d069.webp", "name": "1概念發想.PNG", "caption": "概念發想", "width": 2761, "height": 1748},
          {"src": "assets/generated/featured/process-444fc25e2799.webp", "name": "2概念整理.PNG", "caption": "概念整理", "width": 2761, "height": 1748},
          {"src": "assets/generated/featured/process-c96f874221ee.webp", "name": "3 加入故事.PNG", "caption": "加入故事", "width": 2761, "height": 1748},
          {"src": "assets/generated/featured/process-f001c675b4f9.webp", "name": "4 人物神態.PNG", "caption": "人物神態", "width": 2761, "height": 1748},
          {"src": "assets/generated/featured/process-202e6a971503.webp", "name": "6 上色試驗.PNG", "caption": "上色試驗", "width": 2761, "height": 1748},
          {"src": "assets/originals/illustration-page/work-1d4d7f8557.jpg", "name": "插圖51拷貝.jpg", "caption": "完稿", "width": 2761, "height": 1748},
        ].map(Object.freeze)),
      }),
    }),
    portals: Object.freeze({
      preloadPixels: 250,      // 接近傳送門時才載入牌子，不增加首頁首屏圖片。
      zoom: 1.06,              // 沿用貼圖按鈕的 6% 微放大。
      zoomMs: 180,             // 放大／復位時間，毫秒；與貼圖一致。
      arrows: "assets/generated/portal/arrows.svg",
      cards: Object.freeze([
        { name: "contact", label: "聯絡我", route: "mailto:Jerky628@gmail.com", src: "assets/optimized/3e23883ee0bf2df750012567063d3a386549543e596e98bac8167f5d023a661a.webp", canvas: [2048, 2048], viewBox: [300, 311, 1362, 1544], box: [179, 498, 497, 564] },
        { name: "ip", label: "IP", route: "/ip", src: "assets/optimized/d88f644fb5a51d911a874331010c311fd1b604cbb811e49b84e3349c57750e31.webp", canvas: [2048, 2048], viewBox: [231, 365, 1493, 1326], box: [987, 540, 510, 453] },
        { name: "materials", label: "材料科學", route: "/materials", src: "assets/optimized/668cf07d427a1bacc12ce9d9bc939957b4f61467a2c3f543ebfe9495cd89ecbb.webp", canvas: [2048, 2048], viewBox: [213, 352, 1425, 1452], box: [1808, 499, 567, 578] },
      ].map(Object.freeze)),
    }),
  }),
  ip: Object.freeze({
    stretch: 0.016,       // 本體最多拉伸 1.6%，不移動角色位置，也不拉伸頭上資訊。
    clickHoldMs: 650,     // 點擊新狀態顯示至少 0.65 秒；連點會從最後一次重新計時。
    clickCompression: 0.085, // 點擊最多壓縮高度 8.5%，比觸碰時明顯。
    clickPulseMs: 300,    // 壓縮、輕微回彈與復原時間，不影響狀態停留時間。
    pulseMs: 220,         // 彈出至恢復原形的總時間；每次碰到只播放一次。
    infoRisePixels: 4,    // 對話／資訊進場時輕輕向上移動的畫面像素。
    infoMs: 140,          // 頭上資訊浮出的時間；移開立即恢復原樣。
    artworkAlpha: 24,     // 排除透明邊角，保留原手繪輪廓。
    characters: Object.freeze([
      // box 為兩種本體的共同原稿範圍；splitY 選在原圖本體與資訊之間的透明空隙。
      { name: "cotton", label: "棉花狗", description: "「害怕水、活潑好動」", descriptionColor: "#d78a3f", box: { x: 344, y: 754, width: 725, height: 423 }, splitY: 746, depth: 2 },
      { name: "toast", label: "吐司", description: "「普通的吐司」", descriptionColor: "#000000", box: { x: 860, y: 494, width: 635, height: 475 }, splitY: 472, depth: 1 },
      { name: "green", label: "綠綠的", description: "「隨和、懶懶的」", descriptionColor: "#045600", box: { x: 1167, y: 655, width: 1083, height: 511 }, splitY: 632, depth: 3 },
    ].map(Object.freeze)),
  }),
  ipPortfolio: Object.freeze({
    marqueeRowStagger: 0.5,    // 下排錯開半個圖片間距；不改變每張作品的原始順序。
    marqueePixelsPerSecond: 28, // 插圖橫向移動速度：每秒畫面像素，數字越小越慢。
    zoom: 1.45,                // 碰到／輕點插圖後的放大倍率；固定容器避免閃爍。
    zoomMs: 180,               // 放大與復位時間，單位為毫秒。
    preloadPixels: 400,        // 提前載入下一段跑馬燈圖片的距離，單位為畫面像素。
    portals: Object.freeze({
      preloadPixels: 250,      // 接近傳送門時才載入牌子，不增加首頁首屏圖片。
      zoom: 1.06,              // 沿用貼圖按鈕的 6% 微放大。
      zoomMs: 180,             // 放大／復位時間，毫秒；與貼圖一致。
      arrows: "assets/generated/portal/arrows.svg",
      cards: Object.freeze([
        { name: "contact", label: "聯絡我", route: "mailto:Jerky628@gmail.com", src: "assets/optimized/3e23883ee0bf2df750012567063d3a386549543e596e98bac8167f5d023a661a.webp", canvas: [2048, 2048], viewBox: [300, 311, 1362, 1544], box: [179, 498, 497, 564] },
        { name: "illustration", label: "插圖", route: "/illustration", src: "assets/optimized/893ddb4cc6090e383e172c07b1282041e7724ca0179360083172916b189fe5ee.webp", canvas: [2048, 2048], viewBox: [320, 284, 1307, 1609], box: [987, 450, 510, 627] },
        { name: "materials", label: "材料科學", route: "/materials", src: "assets/optimized/668cf07d427a1bacc12ce9d9bc939957b4f61467a2c3f543ebfe9495cd89ecbb.webp", canvas: [2048, 2048], viewBox: [213, 352, 1425, 1452], box: [1808, 499, 567, 578] },
      ].map(Object.freeze)),
    }),
    illustrations: window.portfolioIllustrations, // 縮圖與原檔對照另見 illustrations.js。
    stickerMotion: Object.freeze({
      zoom: 1.06,              // 圓圈與首圖一起微微放大 6%，固定互動容器避免閃爍。
      zoomMs: 180,             // 放大及對話框淡入時間（毫秒）。
      pixelsPerSecond: 18,     // 長條預覽由上往下移動的速度；只在顯示時播放。
      preloadPixels: 250,     // 首圖接近可見範圍時才載入；預覽等首次碰到才載入。
      dialog: "assets/optimized/ccdc4bd81dcc8e0022ac2bd493377895e8bbb8a919858d433406df265a747351.webp", // 使用原始透明對話框，不重畫。
    }),
    // 編號對應原資料夾；填入真實 https 網址後，首圖會自動成為外部連結。
    stickers: Object.freeze([
      { id: "1", src: "assets/generated/stickers/cover-1-960.webp", preview: "assets/originals/stickers/preview-1.jpg", previewWidth: 1080, previewHeight: 2163, alt: "綠綠的貼圖 1", url: "https://store.line.me/stickershop/product/31474161/zh-Hant" },
      { id: "2", src: "assets/generated/stickers/cover-2-960.webp", preview: "assets/originals/stickers/preview-2.jpg", previewWidth: 1079, previewHeight: 2734, alt: "綠綠的貼圖 2", url: "https://store.line.me/stickershop/product/32869853/zh-Hant" },
    ].map(Object.freeze)),
  }),
  homeIntroductions: Object.freeze({
    delayMs: 28,
    frame: "assets/optimized/735b5fe4f269143f91af7ae3eeaaff62a98e3c619e8a7a75439b4ce1f72759b9.webp",
    cards: Object.freeze([
      { name: "ip", text: "綠綠的與棉花狗\n文創插圖・周邊", image: "assets/originals/home-introductions/ip.jpg", imageAlt: "綠綠的雨中原創插圖", box: [0.395,0.45,0.218] },
      { name: "illustration", text: "原創角色\n日常練習與大圖\n之繪畫過程", image: "assets/optimized/9baef55bae94a7b892dd647b942cf4ed646028afb9979c928cea40fd430b3812.webp", imageAlt: "萬聖節與聖誕節的雙人與餅乾人插畫", box: [0.678,0.29,0.214] },
      { name: "materials", text: "選修、儀器技能\n生醫 × 電性專題\n水凝膠製程", image: "assets/optimized/6bccbddce6e6c420c5cc29fa68f83c8eac63125947cb68295918f64c6dcd19ff.webp", imageAlt: "水凝膠與 PDMS 製程示意圖", box: [0.46,0.46,0.218] },
    ].map(Object.freeze)),
  }),
  motion: Object.freeze({
    liftRatio: 0.13,       // 浮起距離：舞台高度的 13%，約為先前一半；接近頂端會自動限制。
    liftMs: 340,          // 彈起的速度設定，越小越快；小回彈後完全停住。
    returnMs: 180,        // 復位的速度設定，比彈起快；依目前速度平順接續。
    topMarginRatio: 0.025, // 浮起後與畫面頂端保留的間距。
    topMarginBySign: Object.freeze({ illustration: 0.008 }), // 插畫的頂端安全間距；目前仍以降低後的浮起距離為主。
    minimumTopMarginPixels: 8, // 個別提高時保留的最小留白；小螢幕沿用原有安全距離。
    overshoot: 1.025,     // 最多約 2.5% 小回彈，不做持續晃動。
    minimumPopRatio: 0.98, // 快速掠過仍先完成短暫彈起，再自動復位。
    settlePixels: 0.06,   // 移動小到看不見時精確落定並停止動畫。
    settleSpeed: 0.4,     // 落定的速度門檻，單位為畫面像素／秒。
  }),
  hitTest: Object.freeze({
    artworkAlpha: 24,     // 0–255；排除透明像素，保留手繪邊緣。
    groundAlpha: 245,     // 幾乎完全被草地遮住的位置不觸發。
    sweepSamples: 48,     // 原位至浮起位置的取樣數，確保浮起時 hover 穩定。
    maskWidth: 625,       // 只供互動判斷，不影響原圖顯示品質。
    pointerStep: 6,       // 沿快速滑動路徑取樣，避免跳過被碰到的牌子。
  }),
  shadow: Object.freeze({
    groundOpacity: 0.78,  // 接近地面的影子濃度；保留原素材的綠色。
    raisedOpacity: 0.60,  // 浮起後稍微變淡。
    groundSpread: 0.92,   // 接近地面時的寬度倍率。
    raisedSpread: 1.07,   // 浮起後稍微展開，位置仍固定在地面。
    groundFlatten: 1,     // 原圖的扁平比例。
    raisedFlatten: 0.86,  // 浮起後稍微變扁，不改動畫筆觸。
    footRatio: 0.36,      // 依牌子角度推算腳下位置；不跟著牌子向上跑。
    anchors: Object.freeze({
      illustration: { x: 0.604, groundY: 0.612, width: 420, widthRatio: 1.02 }, // 後方地面。
      materials: { x: 0.847, groundY: 0.909, width: 440, widthRatio: 0.98 },    // 中間地面。
      ip: { x: 0.371, groundY: 0.876, width: 590, widthRatio: 1.16 },            // 前方地面。
    }),
  }),
  fur: Object.freeze({
    breeze: Object.freeze({ amplitude: 14, fps: 30 }), // 加大風吹的可見幅度，仍低於滑鼠撫動；閒置最多每秒更新 30 次。
    cacheHeight: 512,     // 原 SVG 的顯示快取高度；保留原稿，避免密集毛流每格重畫細碎向量。
    radius: 220,          // 滑鼠作用半徑，使用原稿 2500×1406 的座標；越大，影響越廣。
    maxBend: 32,          // 最大傾斜角度；限制幅度，避免毛流被拉得太長。
    frequency: 18,        // 回應速度，越大越快。
    damping: 0.82,        // 阻尼（0～1 之間，不含 1）；接近 1 時回彈較少。
    brushSpeed: 650,     // 達到明顯撫動的滑鼠速度，越小越敏感。
    brushDecay: 0.17,     // 撫過後力道消退的秒數；毛流再由彈性自然復位。
    settleAngle: 0.005,   // 撫動接近原位時停止彈簧更新，僅保留低頻微風。
    settleSpeed: 0.05,    // 傾斜速度的落定門檻，單位為度／秒。
    // 共 120 撮：深色 fur02 30 撮、淡色 fur01 90 撮（1：3），保留原色。
    // 原有 72 撮位置不變；補足右上草地，方向與當地邊界垂直。
    // x、y 是根部位置，height 是高度比例；rotation 只旋轉靜態基底，撫動彈簧保持獨立。
    tufts: Object.freeze([
      { artwork: "fur01-1", x: 0.47, y: 0.72008, height: 0.067, rotation: -23.92 },
      { artwork: "fur01-1", x: 0.58, y: 0.85840, height: 0.055, rotation: -21.98 },
      { artwork: "fur01-2", x: 0.3, y: 0.96858, height: 0.063, rotation: -22.09 },
      { artwork: "fur01-2", x: 0.08, y: 0.98454, height: 0.050, rotation: -30.51 },
      { artwork: "fur01-3", x: 0.91, y: 0.87453, height: 0.061, rotation: -5.63 },
      { artwork: "fur01-3", x: 0.76, y: 0.94144, height: 0.052, rotation: -9.66 },
      // 中央偏上。
      { artwork: "fur01-2", x: 0.44, y: 0.72521, height: 0.055, rotation: -19.37 },
      { artwork: "fur01-3", x: 0.49, y: 0.73550, height: 0.050, rotation: -14.65 },
      { artwork: "fur02-3", x: 0.515, y: 0.71275, height: 0.060, rotation: -7.59 },
      // 中央偏下。
      { artwork: "fur01-2", x: 0.55, y: 0.87364, height: 0.061, rotation: -15.85 },
      { artwork: "fur02-2", x: 0.61, y: 0.86546, height: 0.052, rotation: -11.60 },
      { artwork: "fur01-1", x: 0.595, y: 0.82560, height: 0.060, rotation: -21.03 },
      // IP 下方。
      { artwork: "fur02-1", x: 0.27, y: 0.97481, height: 0.050, rotation: -23.45 },
      { artwork: "fur01-3", x: 0.33, y: 0.96136, height: 0.058, rotation: -21.24 },
      { artwork: "fur01-3", x: 0.31, y: 0.93930, height: 0.052, rotation: -21.66 },
      // 左下方。
      { artwork: "fur01-1", x: 0.05, y: 0.98637, height: 0.055, rotation: -40.91 },
      { artwork: "fur01-2", x: 0.11, y: 0.98668, height: 0.048, rotation: -27.70 },
      { artwork: "fur01-2", x: 0.1, y: 0.96532, height: 0.060, rotation: -28.63 },
      // 材料科學右下方。
      { artwork: "fur01-3", x: 0.88, y: 0.91418, height: 0.055, rotation: -7.22 },
      { artwork: "fur01-2", x: 0.94, y: 0.90740, height: 0.058, rotation: -3.94 },
      { artwork: "fur01-1", x: 0.925, y: 0.81307, height: 0.052, rotation: -13.08 },
      // 材料科學左下方。
      { artwork: "fur01-3", x: 0.73, y: 0.92921, height: 0.061, rotation: -9.59 },
      { artwork: "fur01-1", x: 0.79, y: 0.94960, height: 0.050, rotation: -17.06 },
      { artwork: "fur01-1", x: 0.78, y: 0.88735, height: 0.063, rotation: -17.32 },
      // 左側與左下方：補足原本小群之間的空隙。
      { artwork: "fur02-1", x: 0.025, y: 0.97766, height: 0.053, rotation: -34.33 },
      { artwork: "fur01-3", x: 0.045, y: 0.95725, height: 0.057, rotation: -32.67 },
      { artwork: "fur01-3", x: 0.08, y: 0.94782, height: 0.060, rotation: -30.21 },
      { artwork: "fur01-2", x: 0.135, y: 0.93704, height: 0.051, rotation: -25.75 },
      { artwork: "fur01-2", x: 0.16, y: 0.97149, height: 0.060, rotation: -25.91 },
      { artwork: "fur01-1", x: 0.19, y: 0.94995, height: 0.054, rotation: -33.10 },
      { artwork: "fur01-1", x: 0.225, y: 0.97250, height: 0.059, rotation: -31.29 },
      { artwork: "fur01-2", x: 0.035, y: 0.99662, height: 0.048, rotation: -32.89 },
      { artwork: "fur02-3", x: 0.145, y: 0.99186, height: 0.052, rotation: -16.85 },
      { artwork: "fur01-3", x: 0.205, y: 0.99004, height: 0.051, rotation: -23.98 },
      { artwork: "fur01-1", x: 0.245, y: 0.93967, height: 0.055, rotation: -30.19 },
      { artwork: "fur01-2", x: 0.355, y: 0.98248, height: 0.056, rotation: -20.98 },
      // IP 右側通往畫面中央，分布不排成整齊格線。
      { artwork: "fur01-2", x: 0.39, y: 0.76037, height: 0.057, rotation: -21.61 },
      { artwork: "fur01-1", x: 0.42, y: 0.79678, height: 0.062, rotation: -29.22 },
      { artwork: "fur02-3", x: 0.38, y: 0.87268, height: 0.054, rotation: -12.39 },
      { artwork: "fur01-1", x: 0.415, y: 0.91349, height: 0.059, rotation: -29.65 },
      { artwork: "fur01-3", x: 0.46, y: 0.86488, height: 0.056, rotation: -16.60 },
      { artwork: "fur01-2", x: 0.48, y: 0.93727, height: 0.060, rotation: -15.22 },
      { artwork: "fur02-2", x: 0.5, y: 0.88239, height: 0.053, rotation: -13.73 },
      { artwork: "fur02-3", x: 0.435, y: 0.96513, height: 0.051, rotation: -11.25 },
      { artwork: "fur01-1", x: 0.535, y: 0.97193, height: 0.055, rotation: -24.68 },
      { artwork: "fur01-1", x: 0.57, y: 0.92996, height: 0.058, rotation: -22.79 },
      { artwork: "fur01-2", x: 0.62, y: 0.96896, height: 0.052, rotation: -13.38 },
      { artwork: "fur01-3", x: 0.665, y: 0.93489, height: 0.060, rotation: -11.73 },
      // 中央草地：以淡色為主，深色分散點綴。
      { artwork: "fur01-3", x: 0.54, y: 0.69418, height: 0.060, rotation: -16.06 },
      { artwork: "fur01-2", x: 0.575, y: 0.71835, height: 0.056, rotation: -14.29 },
      { artwork: "fur01-1", x: 0.62, y: 0.72687, height: 0.062, rotation: -21.47 },
      { artwork: "fur01-2", x: 0.65, y: 0.65261, height: 0.054, rotation: -12.62 },
      { artwork: "fur02-1", x: 0.675, y: 0.70208, height: 0.058, rotation: -13.19 },
      { artwork: "fur01-3", x: 0.7, y: 0.63411, height: 0.053, rotation: -10.24 },
      { artwork: "fur01-3", x: 0.405, y: 0.68800, height: 0.055, rotation: -21.87 },
      { artwork: "fur02-1", x: 0.445, y: 0.61830, height: 0.059, rotation: -20.46 },
      { artwork: "fur02-2", x: 0.57, y: 0.56810, height: 0.052, rotation: -13.24 },
      { artwork: "fur01-2", x: 0.61, y: 0.52301, height: 0.060, rotation: -13.06 },
      { artwork: "fur01-3", x: 0.64, y: 0.55467, height: 0.056, rotation: -12.75 },
      { artwork: "fur02-1", x: 0.685, y: 0.51430, height: 0.053, rotation: -12.75 },
      // 右側與材料科學下方。
      { artwork: "fur02-1", x: 0.97, y: 0.42946, height: 0.057, rotation: -3.46 },
      { artwork: "fur01-3", x: 0.96, y: 0.61466, height: 0.055, rotation: -2.31 },
      { artwork: "fur02-2", x: 0.98, y: 0.73939, height: 0.050, rotation: -0.37 },
      { artwork: "fur01-3", x: 0.965, y: 0.93178, height: 0.056, rotation: -1.91 },
      { artwork: "fur02-2", x: 0.9, y: 0.73447, height: 0.058, rotation: -5.03 },
      { artwork: "fur01-1", x: 0.865, y: 0.79877, height: 0.052, rotation: -15.55 },
      { artwork: "fur01-1", x: 0.815, y: 0.87410, height: 0.057, rotation: -16.00 },
      { artwork: "fur02-2", x: 0.84, y: 0.96744, height: 0.053, rotation: -5.21 },
      { artwork: "fur02-3", x: 0.705, y: 0.98033, height: 0.051, rotation: -1.78 },
      { artwork: "fur01-3", x: 0.715, y: 0.81977, height: 0.059, rotation: -9.69 },
      { artwork: "fur01-1", x: 0.67, y: 0.82445, height: 0.054, rotation: -19.89 },
      { artwork: "fur02-2", x: 0.755, y: 0.75234, height: 0.060, rotation: -8.69 },
      // 右上草坡：沿現有交界法線補上可撫動毛流。
      { artwork: "fur01-2", x: 0.755, y: 0.29839, height: 0.055, rotation: -10.15 },
      { artwork: "fur01-3", x: 0.808, y: 0.25925, height: 0.052, rotation: -7.94 },
      { artwork: "fur02-1", x: 0.864, y: 0.22723, height: 0.057, rotation: -9.03 },
      { artwork: "fur01-1", x: 0.923, y: 0.18309, height: 0.053, rotation: -13.19 },
      { artwork: "fur01-3", x: 0.975, y: 0.17173, height: 0.050, rotation: -1.39 },
      { artwork: "fur01-1", x: 0.776, y: 0.39559, height: 0.058, rotation: -17.42 },
      { artwork: "fur02-2", x: 0.832, y: 0.35358, height: 0.052, rotation: -5.59 },
      { artwork: "fur01-2", x: 0.89, y: 0.32442, height: 0.056, rotation: -7.02 },
      { artwork: "fur01-3", x: 0.945, y: 0.28811, height: 0.054, rotation: -3.38 },
      { artwork: "fur01-2", x: 0.985, y: 0.31246, height: 0.050, rotation: -2.10 },
      { artwork: "fur02-3", x: 0.745, y: 0.54408, height: 0.053, rotation: -1.70 },
      { artwork: "fur01-3", x: 0.805, y: 0.49568, height: 0.057, rotation: -8.08 },
      { artwork: "fur01-1", x: 0.86, y: 0.48936, height: 0.055, rotation: -15.23 },
      { artwork: "fur01-2", x: 0.917, y: 0.43593, height: 0.058, rotation: -5.52 },
      { artwork: "fur02-1", x: 0.965, y: 0.46028, height: 0.052, rotation: -3.83 },
      { artwork: "fur01-1", x: 0.875, y: 0.60154, height: 0.054, rotation: -15.74 },
      // 補密草叢間與右上空隙；沿用鄰近草叢的朝向和原始素材。
      { artwork: "fur02-1", x: 0.220, y: 0.760, height: 0.048, rotation: -30.19 },
      { artwork: "fur01-2", x: 0.500, y: 0.480, height: 0.052, rotation: -13.24 },
      { artwork: "fur01-3", x: 0.280, y: 0.820, height: 0.055, rotation: -21.66 },
      { artwork: "fur01-1", x: 0.160, y: 0.820, height: 0.050, rotation: -25.75 },
      { artwork: "fur02-2", x: 0.920, y: 0.540, height: 0.048, rotation: -15.74 },
      { artwork: "fur01-3", x: 0.520, y: 0.600, height: 0.052, rotation: -13.24 },
      { artwork: "fur01-1", x: 0.220, y: 0.860, height: 0.055, rotation: -30.19 },
      { artwork: "fur01-2", x: 0.600, y: 0.640, height: 0.050, rotation: -13.24 },
      { artwork: "fur02-3", x: 0.740, y: 0.460, height: 0.048, rotation: -1.70 },
      { artwork: "fur01-1", x: 0.520, y: 0.800, height: 0.052, rotation: -14.65 },
      { artwork: "fur01-2", x: 0.320, y: 0.860, height: 0.055, rotation: -21.66 },
      { artwork: "fur01-3", x: 0.880, y: 0.400, height: 0.050, rotation: -5.52 },
      { artwork: "fur02-1", x: 0.720, y: 0.700, height: 0.048, rotation: -10.24 },
      { artwork: "fur01-2", x: 0.740, y: 0.620, height: 0.052, rotation: -10.24 },
      { artwork: "fur01-3", x: 0.940, y: 0.360, height: 0.055, rotation: -3.38 },
      { artwork: "fur01-1", x: 0.540, y: 0.520, height: 0.050, rotation: -13.24 },
      { artwork: "fur02-2", x: 0.960, y: 0.540, height: 0.048, rotation: -2.31 },
      { artwork: "fur01-3", x: 0.820, y: 0.420, height: 0.052, rotation: -5.59 },
      { artwork: "fur01-1", x: 0.180, y: 0.880, height: 0.055, rotation: -33.10 },
      { artwork: "fur01-2", x: 0.760, y: 0.820, height: 0.050, rotation: -8.69 },
      { artwork: "fur02-3", x: 0.960, y: 0.840, height: 0.048, rotation: -13.08 },
      { artwork: "fur01-1", x: 0.560, y: 0.800, height: 0.052, rotation: -21.03 },
      { artwork: "fur01-2", x: 0.480, y: 0.800, height: 0.055, rotation: -14.65 },
      { artwork: "fur01-3", x: 0.900, y: 0.260, height: 0.050, rotation: -7.02 },
      { artwork: "fur02-1", x: 0.280, y: 0.900, height: 0.048, rotation: -21.66 },
      { artwork: "fur01-2", x: 0.700, y: 0.880, height: 0.052, rotation: -9.69 },
      { artwork: "fur01-3", x: 0.700, y: 0.760, height: 0.055, rotation: -9.69 },
      { artwork: "fur01-1", x: 0.560, y: 0.640, height: 0.050, rotation: -16.06 },
      { artwork: "fur02-2", x: 0.680, y: 0.580, height: 0.048, rotation: -10.24 },
      { artwork: "fur01-3", x: 0.640, y: 0.780, height: 0.052, rotation: -21.47 },
      { artwork: "fur01-1", x: 0.920, y: 0.960, height: 0.055, rotation: -3.94 },
      { artwork: "fur01-2", x: 0.120, y: 0.880, height: 0.050, rotation: -25.75 },
    ].map(Object.freeze)),
  }),
});
