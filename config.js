// Всё, что нужно поменять под себя, — здесь.
// Имя можно также передать через ссылку: index.html?name=Даша
window.INVITE = {
  friendName: "Даша",
  senderName: "Я",

  // Откуда летим (для посадочного талона)
  fromCity: "Ереван",
  fromCode: "EVN",
  fromCoords: [40.18, 44.51], // широта, долгота — точка старта на карте

  // Даты: формат "ГГГГ-ММ-ДД". Пока null — показывается «начало октября».
  arriveBy: "2026-10-03",
  departDate: null,
  returnDate: null,

  // Куда отправлять ответ с последней страницы.
  //
  // Вариант 1 (автоматически, в Telegram): бот шлёт сообщение вам в личку.
  //   1) в @BotFather создайте бота → получите token;
  //   2) напишите боту любое сообщение (иначе он не сможет писать вам);
  //   3) откройте https://api.telegram.org/bot<token>/getUpdates и возьмите
  //      "chat":{"id":123456789} — это chatId.
  // Значения лежат в secrets.js (не в git); на GitHub Pages подставляются из секретов.
  telegramBot: window.TG || { token: "", chatId: "" },,

  // Вариант 2 (запасной, если бот не настроен): открыть чат и вставить текст.
  // telegram — username без @, whatsapp — номер в формате 79991234567
  contact: {
    telegram: "",
    whatsapp: "",
  },

  // Фото-страницы, идут сразу после «Да». Фото — Wikimedia Commons (свободные лицензии).
  stories: [
    {
      kicker: "🏮 3–18 октября",
      title: "Заглянем на фестиваль фонарей?",
      text: "Река Намган загорается тысячами фонарей — и открытие ровно в день нашего прилёта. Загадаем по желанию и отпустим фонарики по воде.",
      facts: ["🕕 огни с 18:00", "🚌 ≈1,5 ч от Пусана"],
      // flee: true — «Нет» просто уплывает от курсора, нажать нельзя (реплики не нужны)
      flee: true,
      photo: "assets/photos/jinju_namgang_lantern_festival.jpg",
      credit: "Asfreeas, CC BY 3.0",
      source: "https://commons.wikimedia.org/wiki/File:Jinju_namgang_lantern_festival.jpg",
      // Доп. фото — маленькие полароиды поверх основного
      extras: [
        { photo: "assets/photos/jinju_namgang_lantern_festival_crane_lantern.jpg", caption: "журавли", credit: "Asfreeas, CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Jinju_namgang_lantern_festival_crane_lantern.jpg" },
        { photo: "assets/photos/jinju_namgang_lantern_festival_lantern.jpg", caption: "светящийся сад", credit: "Asfreeas, CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Jinju_namgang_lantern_festival_lantern.jpg" },
      ],
    },
    {
      kicker: "⛰️ Сеул сверху",
      title: "Поднимемся на Добонсан?",
      text: "Гранитные пики прямо в Сеуле — доезжаем на метро и идём вверх. В октябре склоны уже в осенних красках.",
      facts: ["📍 вершина Чаунбон, 740 м", "🚇 метро до ст. Добонсан", "🍜 рамён после спуска"],
      // shrink: true — чем ближе курсор, тем меньше «Нет», пока не станет в пару пикселей
      shrink: true,
      photo: "assets/photos/dobongsan-obong.jpg",
      credit: "Jinhwae Kim, CC0",
      source: "https://commons.wikimedia.org/wiki/File:Dobongsan-Obong.jpg",
      // Доп. фото — маленькие полароиды поверх основного
      extras: [
        { photo: "assets/photos/mount_dobongsan_peaks_seoninbong_708m_manjangbong_718m_j.jpg", caption: "над облаками", credit: "Kellnerp, CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Mount_Dobongsan_peaks_Seoninbong_(708m),_Manjangbong_(718m),_Jaunbong_(740m)_and_Shinseondae_(730m).JPG" },
        { photo: "assets/photos/dobongsan.jpg", caption: "храм с видом на Сеул", credit: "Mumbo jiggy, CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Dobongsan.jpg" },
      ],
    },
    {
      kicker: "🏝️ Остров вулканов",
      title: "Сгоняем на Чеджу?",
      text: "Час полёта — и мы на острове: встречаем рассвет на кратере Сонсан Ильчхульбон, едим местные мандарины.",
      facts: ["✈️ ≈1 ч из Сеула", "🌅 рассвет на кратере", "🍊 мандарины Халлабон"],
      // scatter: true — буквы «Н», «е», «т» разлетаются от курсора и собираются обратно
      scatter: true,
      photo: "assets/photos/seongsan_ilchulbong_from_the_air.jpg",
      credit: "Korea.net, CC BY-SA 2.0",
      source: "https://commons.wikimedia.org/wiki/File:Seongsan_Ilchulbong_from_the_air.jpg",
      // Доп. фото — маленькие полароиды поверх основного
      extras: [
        { photo: "assets/photos/hydrangea_macrophylla_in_front_of_seongsan_ilchulbong_vo.jpg", caption: "гортензии у кратера", credit: "Basile Morin, CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Hydrangea_macrophylla_in_front_of_Seongsan_Ilchulbong_volcano_at_blue_hour_in_Jeju_Island_South_Korea.jpg" },
        { photo: "assets/photos/wooden_staircase_along_yeongsil_trail_with_the_mountains.jpg", caption: "тропа на Халласан", credit: "Basile Morin, CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Wooden_staircase_along_Yeongsil_Trail_with_the_mountains_of_Hallasan_Park_Jeju_Island_South_Korea.jpg" },
      ],
    },
    {
      kicker: "🚄 Тот самый поезд",
      title: "Поехали в Пусан на поезде?",
      text: "Садимся на KTX в Сеуле — и через 2,5 часа мы у моря. Всё как в фильме. Но зомби не обещаю.",
      facts: ["⏱️ ≈2,5 часа", "🪟 два места у окна", "🧟 Будут зомби (наверное)"],
      // zombie: true — «Нет» ковыляет к курсору, как зомби; догонит — «укусит» и станет «Да»
      zombie: true,
      photo: "assets/photos/ktx-cheongryong_waiting_at_seoul_station.jpg",
      credit: "생각하는 나무, CC BY-SA 4.0",
      source: "https://commons.wikimedia.org/wiki/File:KTX-Cheongryong_Waiting_at_Seoul_Station.jpg",
      // Доп. фото — маленькие полароиды поверх основного
      extras: [
        { photo: "assets/photos/colorful_houses_in_gamcheon_culture_village_at_sunset_in.jpg", caption: "Камчхон", credit: "Basile Morin, CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Colorful_houses_in_Gamcheon_Culture_Village_at_sunset_in_Busan_South_Korea.jpg" },
        { photo: "assets/photos/haeundae_beach_nightview.jpg", caption: "Хэундэ ночью", credit: "Haeundae-gu, CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Haeundae_Beach_NightView.jpg" },
      ],
      // Второе фото — полароид поверх основного
      polaroid: {
        photo: "assets/photos/brisbane_zombie_walk_2011_-_andrewmercer_img03550.jpg",
        caption: "соседний вагон",
        credit: "Andrew Mercer, CC BY-SA 4.0",
        source: "https://commons.wikimedia.org/wiki/File:Brisbane_Zombie_Walk_2011_-_AndrewMercer_IMG03550.jpg",
      },
    },
    {
      kicker: "🚃 Вагончик над морем",
      title: "Прокатимся на капсуле?",
      text: "Маленькая жёлтая капсула неспешно едет над побережьем Пусана от Мипо до Чхонсапхо. Полчаса — только мы и море.",
      facts: ["📏 2,3 км · ≈30 мин", "👫 капсула на двоих", "🎟️ бронируем заранее"],
      // sink: true — при приближении курсора «Нет» уходит под воду, отходишь — всплывает
      sink: true,
      photo: "assets/photos/sky_capsule_train_at_haeundae_blueline_park_busan.jpg",
      credit: "VN.NguyenDucDuy, CC BY-SA 4.0",
      source: "https://commons.wikimedia.org/wiki/File:Sky_Capsule_train_at_Haeundae_Blueline_Park,_Busan.jpg",
      // Доп. фото — маленькие полароиды поверх основного
      extras: [
        { photo: "assets/photos/cheongsapo.jpg", caption: "маяк Чхонсапхо", credit: "Andrewssi2, CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Cheongsapo.jpg" },
        { photo: "assets/photos/songjeong_beach.jpg", caption: "пляж Сонджон", credit: "Andrewssi2, CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Songjeong_Beach.jpg" },
      ],
    },
  ],

  // Места-тизеры (карусель «Пройдёмся и по Сеулу?»)
  places: [
    { emoji: "🏯", title: "Кёнбоккун", photo: "assets/photos/gyeongbokgung_palace.jpg", credit: "Brady Bellini, CC0", source: "https://commons.wikimedia.org/wiki/File:Gyeongbokgung(palace)_Geunjeongjeon(hall).jpg", text: "Погуляем по дворцу", bg: "#fbe9d7" },
    { emoji: "🌃", title: "Башня Намсан", photo: "assets/photos/n_seoul_tower_view.jpg", credit: "kallerna, CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:N_Seoul_Tower_view_1.jpg", text: "Огни Сеула на закате", bg: "#e4ecf7" },
    { emoji: "🍁", title: "Осенние клёны", photo: "assets/photos/mount_dobongsan_peaks_seoninbong_708m_manjangbong_718m_j.jpg", credit: "Kellnerp, CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Mount_Dobongsan_peaks_Seoninbong_(708m),_Manjangbong_(718m),_Jaunbong_(740m)_and_Shinseondae_(730m).JPG", text: "В октябре горы становятся красно-золотыми", bg: "#f9dfd3" },
    { emoji: "🍢", title: "Мёндон ночью", photo: "assets/photos/myeongdong_night_market.jpg", credit: "Sgroey, CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Myeongdong_night_market_seoul_1.jpg", text: "Уличная еда: токпокки, хотток, всё на палочке", bg: "#faf0d2" },
    { emoji: "🌉", title: "Река Ханган", photo: "assets/photos/banpo_bridge_fountain.jpg", credit: "Wvdp, CC0", source: "https://commons.wikimedia.org/wiki/File:Banpo_Bridge_Moonlight_Rainbow_Fountain_at_night_-_2023-08-14.jpg", text: "Пикник у воды, рамён из круглосуточного и фонтан на мосту Банпо", bg: "#e2f0ec" },
  ],

  // Варианты занятий (экран выбора)
  activities: [
    "🏮 Фестиваль фонарей",
    "⛰️ Добонсан",
    "🏝️ Чеджу",
    "🚄 KTX в Пусан",
    "🚃 Капсула Мипо",
    "🥩 Корейское BBQ",
    "👘 Ханбоки и фотосессия",
    "🎤 Норэбан (караоке)",
    "💄 Шопинг K-beauty",
    "🎢 Lotte World",
    "♨️ Чимджильбан",
    "🍜 Стритфуд-тур",
    "☕ Милые кафе",
    "🎶 K-pop места",
    "🌙 Ночной Сеул",
  ],
};
