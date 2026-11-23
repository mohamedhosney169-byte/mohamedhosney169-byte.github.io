/**
 * دليل استخدام Kahoot التفاعلي + زر الرابط المباشر في قسم الألعاب التفاعلية
 * متوافق مع الواجهات العربية (RTL) ويعمل تلقائياً عند تحميل الصفحة
 */
 (function () {
    "use strict";
  
    const KAHOOT_DATA = {
      mainUrl: "https://kahoot.com",
      createUrl: "https://create.kahoot.it",
      playUrl: "https://kahoot.it",
      toggleButtonText: "📖 طريقة استخدام Kahoot من التسجيل إلى بناء اللعبة",
      directButtonText: "🎮 فتح منصة Kahoot مباشرة",
      steps: [
        {
          number: "1",
          title: "إنشاء الحساب واختيار الدور",
          description:
            "ادخل إلى موقع Kahoot واختر تسجيل حساب جديد (Sign up)، ثم حدد دورك المناسب بدقة (معلم Teacher، طالب Student، جهة عمل/فعالية، أو استخدام شخصي) وأكمل بيانات التسجيل للوصول إلى لوحة التحكم."
        },
        {
          number: "2",
          title: "إنشاء مشروع لعبة جديدة",
          description:
            "من لوحة التحكم الرئيسية، اضغط على زر «Create» (إنشاء) لبدء مشروع جديد، واختر قالب «Kahoot» التفاعلي (أو قالب جاهز للتعديل عليه) للدخول إلى محرر بناء الأسئلة."
        },
        {
          number: "3",
          title: "إضافة العنوان والأسئلة والخيارات وتحديد الإجابة الصحيحة والوقت",
          description:
            "اكتب عنواناً واضحاً وجذاباً للعبة، ثم أضف نص السؤال الأول واختيارات الإجابة (غالباً 2 إلى 4 خيارات). علّم على الإجابة الصحيحة بوضوح، واضبط المؤقت الزمني المناسب لكل سؤال (مثل 20 أو 30 ثانية) حسب مستوى صعوبته."
        },
        {
          number: "4",
          title: "إرفاق الصور وإضافة أسئلة جديدة",
          description:
            "ارفق صورة توضيحية أو وسائط مناسبة لكل سؤال لزيادة التفاعل البصري، ثم استخدم زر «Add question» لإضافة أسئلة جديدة وتنويع أنماطها حتى اكتمال بنك أسئلة اللعبة."
        },
        {
          number: "5",
          title: "حفظ اللعبة وتشغيلها ومشاركة رمز Game PIN",
          description:
            "احفظ اللعبة وأنهِ إعداداتها، ثم اضغط على «Start» لتشغيلها مباشرة (Live) أو تعيينها كتحدٍ. سيظهر لك رمز الدخول الفريد (Game PIN) على الشاشة؛ شاركه مع اللاعبين ليدخلوا من أجهزتهم ويبدأ اللعب فوراً."
        }
      ]
    };
  
    /**
     * حقن تنسيقات CSS الخاصة بالدليل والأزرار مرة واحدة فقط
     */
    function injectStyles() {
      if (document.getElementById("kahoot-interactive-guide-styles")) return;
  
      const style = document.createElement("style");
      style.id = "kahoot-interactive-guide-styles";
      style.textContent = `
        .kh-wrapper {
          direction: rtl;
          text-align: right;
          font-family: inherit;
          margin: 16px 0;
        }
  
        .kh-actions-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }
  
        .kh-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 18px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
        }
  
        .kh-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }
  
        .kh-btn:active {
          transform: translateY(0);
        }
  
        .kh-btn-guide {
          background: #46178f;
          color: #ffffff;
        }
  
        .kh-btn-guide:hover {
          background: #381273;
        }
  
        .kh-btn-direct {
          background: #26890c;
          color: #ffffff;
        }
  
        .kh-btn-direct:hover {
          background: #1e6e09;
        }
  
        .kh-panel {
          display: none;
          margin-top: 14px;
          padding: 20px;
          border-radius: 14px;
          background: #faf9fc;
          border: 1px solid #dfd7ef;
          box-shadow: 0 8px 24px rgba(70, 23, 143, 0.08);
        }
  
        .kh-panel.is-open {
          display: block;
          animation: khFadeIn 0.22s ease-out;
        }
  
        @keyframes khFadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
  
        .kh-panel-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding-bottom: 14px;
          margin-bottom: 16px;
          border-bottom: 1px solid #e7e1f3;
        }
  
        .kh-panel-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #2b0d59;
        }
  
        .kh-close-btn {
          background: transparent;
          border: 1px solid #cbbde8;
          color: #46178f;
          border-radius: 8px;
          padding: 5px 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
  
        .kh-close-btn:hover {
          background: #efe9fa;
        }
  
        .kh-quick-links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
          padding: 12px;
          border-radius: 10px;
          background: #f1ecf9;
        }
  
        .kh-quick-links-label {
          width: 100%;
          font-size: 13px;
          font-weight: 700;
          color: #46178f;
          margin-bottom: 2px;
        }
  
        .kh-quick-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          background: #ffffff;
          color: #2b0d59;
          border: 1px solid #d4c5f0;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
  
        .kh-quick-link:hover {
          background: #46178f;
          color: #ffffff;
          border-color: #46178f;
        }
  
        .kh-steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 12px;
        }
  
        .kh-step-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid #ece6f7;
        }
  
        .kh-step-badge {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #46178f;
          color: #ffffff;
          font-weight: 800;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }
  
        .kh-step-content h4 {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 800;
          color: #1f1f2e;
        }
  
        .kh-step-content p {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: #44445a;
        }
      `;
      document.head.appendChild(style);
    }
  
    /**
     * العثور على قسم الألعاب التفاعلية أو إنشاؤه كحاوية احتياطية
     */
    function getInteractiveGamesSection() {
      const selectors = [
        "#interactive-games",
        ".interactive-games",
        "[data-section='interactive-games']",
        "[data-games-section]"
      ];
  
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) return el;
      }
  
      // البحث عن عنصر يحتوي نص "الألعاب التفاعلية"
      const candidates = Array.from(
        document.querySelectorAll("section, div, article, aside")
      );
      for (const el of candidates) {
        const heading = el.querySelector("h1, h2, h3, h4");
        if (heading && heading.textContent.includes("الألعاب التفاعلية")) {
          return el;
        }
      }
  
      // إنشاء قسم افتراضي في نهاية الصفحة إذا لم يوجد قسم باسم الألعاب التفاعلية
      const fallbackSection = document.createElement("section");
      fallbackSection.id = "interactive-games";
      fallbackSection.setAttribute("dir", "rtl");
      fallbackSection.style.margin = "24px auto";
      fallbackSection.style.maxWidth = "960px";
      fallbackSection.style.padding = "16px";
  
      const title = document.createElement("h2");
      title.textContent = "الألعاب التفاعلية";
      fallbackSection.appendChild(title);
  
      document.body.appendChild(fallbackSection);
      return fallbackSection;
    }
  
    /**
     * بناء عنصر واجهة Kahoot (الزر المباشر + زر الشرح التفاعلي + لوحة الخطوات والروابط السريعة)
     */
    function buildKahootWidget() {
      const wrapper = document.createElement("div");
      wrapper.className = "kh-wrapper";
      wrapper.setAttribute("dir", "rtl");
  
      const actionsBar = document.createElement("div");
      actionsBar.className = "kh-actions-bar";
  
      // زر الرابط المباشر إلى Kahoot داخل قسم الألعاب التفاعلية
      const directLinkBtn = document.createElement("a");
      directLinkBtn.href = KAHOOT_DATA.mainUrl;
      directLinkBtn.target = "_blank";
      directLinkBtn.rel = "noopener noreferrer";
      directLinkBtn.className = "kh-btn kh-btn-direct";
      directLinkBtn.textContent = KAHOOT_DATA.directButtonText;
  
      // زر فتح/إغلاق طريقة استخدام Kahoot
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "kh-btn kh-btn-guide";
      toggleBtn.textContent = KAHOOT_DATA.toggleButtonText;
      toggleBtn.setAttribute("aria-expanded", "false");
  
      const panelId = "kahoot-guide-panel-" + Math.random().toString(36).slice(2, 8);
      toggleBtn.setAttribute("aria-controls", panelId);
  
      // لوحة الشرح المنظم خطوة بخطوة
      const panel = document.createElement("div");
      panel.id = panelId;
      panel.className = "kh-panel";
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-label", "دليل استخدام Kahoot خطوة بخطوة");
  
      const panelHeader = document.createElement("div");
      panelHeader.className = "kh-panel-header";
  
      const panelTitle = document.createElement("h3");
      panelTitle.className = "kh-panel-title";
      panelTitle.textContent = "خطوات استخدام Kahoot من التسجيل إلى بناء اللعبة وتشغيلها";
  
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "kh-close-btn";
      closeBtn.textContent = "إغلاق الشرح ✕";
  
      panelHeader.appendChild(panelTitle);
      panelHeader.appendChild(closeBtn);
  
      // روابط سريعة داخل الدليل: منشئ اللعبة وصفحة دخول اللاعبين
      const quickLinksBox = document.createElement("div");
      quickLinksBox.className = "kh-quick-links";
  
      const quickLinksLabel = document.createElement("span");
      quickLinksLabel.className = "kh-quick-links-label";
      quickLinksLabel.textContent = "روابط سريعة:";
  
      const createGameLink = document.createElement("a");
      createGameLink.href = KAHOOT_DATA.createUrl;
      createGameLink.target = "_blank";
      createGameLink.rel = "noopener noreferrer";
      createGameLink.className = "kh-quick-link";
      createGameLink.textContent = "🛠️ منشئ اللعبة (create.kahoot.it)";
  
      const joinGameLink = document.createElement("a");
      joinGameLink.href = KAHOOT_DATA.playUrl;
      joinGameLink.target = "_blank";
      joinGameLink.rel = "noopener noreferrer";
      joinGameLink.className = "kh-quick-link";
      joinGameLink.textContent = "🎯 صفحة دخول اللاعبين (kahoot.it)";
  
      quickLinksBox.appendChild(quickLinksLabel);
      quickLinksBox.appendChild(createGameLink);
      quickLinksBox.appendChild(joinGameLink);
  
      // قائمة الخطوات المنظمة
      const stepsList = document.createElement("ol");
      stepsList.className = "kh-steps-list";
  
      KAHOOT_DATA.steps.forEach((step) => {
        const item = document.createElement("li");
        item.className = "kh-step-item";
  
        const badge = document.createElement("span");
        badge.className = "kh-step-badge";
        badge.textContent = step.number;
  
        const content = document.createElement("div");
        content.className = "kh-step-content";
  
        const stepTitle = document.createElement("h4");
        stepTitle.textContent = step.title;
  
        const stepDesc = document.createElement("p");
        stepDesc.textContent = step.description;
  
        content.appendChild(stepTitle);
        content.appendChild(stepDesc);
  
        item.appendChild(badge);
        item.appendChild(content);
        stepsList.appendChild(item);
      });
  
      panel.appendChild(panelHeader);
      panel.appendChild(quickLinksBox);
      panel.appendChild(stepsList);
  
      // التحكم في فتح وإغلاق الشرح
      function setPanelState(open) {
        panel.classList.toggle("is-open", open);
        toggleBtn.setAttribute("aria-expanded", String(open));
      }
  
      toggleBtn.addEventListener("click", function () {
        const isCurrentlyOpen = panel.classList.contains("is-open");
        setPanelState(!isCurrentlyOpen);
      });
  
      closeBtn.addEventListener("click", function () {
        setPanelState(false);
        toggleBtn.focus();
      });
  
      actionsBar.appendChild(directLinkBtn);
      actionsBar.appendChild(toggleBtn);
  
      wrapper.appendChild(actionsBar);
      wrapper.appendChild(panel);
  
      return wrapper;
    }
  
    /**
     * تهيئة الإضافة عند جاهزية DOM
     */
    function initKahootGuide() {
      const targetSection = getInteractiveGamesSection();
      if (!targetSection || targetSection.querySelector(".kh-wrapper")) return;
  
      injectStyles();
      const widget = buildKahootWidget();
      targetSection.appendChild(widget);
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initKahootGuide);
    } else {
      initKahootGuide();
    }
  })();
