
      import { GoogleGenAI, Type } from "@google/genai";

      document.addEventListener("DOMContentLoaded", () => {
        // --- SUPABASE SETUP START ---
        const SUPABASE_URL = "https://gyzrsrxzzturoqwhuiul.supabase.co";
        const SUPABASE_ANON_KEY =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5enJzcnh6enR1cm9xd2h1aXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODYxNDcsImV4cCI6MjA5MTA2MjE0N30.CJAFW3acVnOwb5hvSDO6H0TGPTK__MOTBdgUxUWpM70";

        const { createClient } = supabase;
        let supabaseClient;

        function initializeSupabase() {
          try {
            if (
              SUPABASE_URL === "YOUR_SUPABASE_URL" ||
              SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY"
            ) {
              showNotificationModal(
                "ตั้งค่า Supabase",
                "กรุณาคัดลอก Supabase URL และ Anon Key มาใส่ในไฟล์ index.html ก่อนใช้งาน",
              );
              return false;
            }
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Supabase client initialized.");
            return true;
          } catch (error) {
            console.error("Supabase initialization failed:", error);
            showNotificationModal(
              "Supabase Error",
              "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า Supabase",
            );
            return false;
          }
        }
        // --- SUPABASE SETUP END ---

        // --- CONFIGURATION & CONSTANTS ---
        const CONFIG = {
          FLOORS: [8, 7, 6, 5, 4, 3, 2],
          COMMON_AREA_FLOORS: [2, 3, 4, 5, 6, 7, 8],
          ROOMS_BY_FLOOR: {
            2: 8,
            3: 12,
            4: 12,
            5: 12,
            6: 12,
            7: 12,
            8: 11,
          },
          getRoomsOnFloor(floor) {
            return this.ROOMS_BY_FLOOR[floor] || 12;
          },
          MAX_ROOMS: 12,
          get TOTAL_UNITS() {
            return Object.values(this.ROOMS_BY_FLOOR).reduce(
              (a, b) => a + b,
              0,
            );
          },
          DB_TABLE_NAME: "project_data",
          DB_ROW_ID: 1,
          GEMINI_API_MODEL: "gemini-2.5-flash",
        };

        const hasBedroomDoor = (floor, room) => {
          if (floor === 2) return [2, 7].includes(room);
          if (floor >= 3 && floor <= 7) return [4, 9].includes(room);
          if (floor === 8) return [8].includes(room);
          return false;
        };

        const taskDefinitions = {
          skimAndPaint: {
            name: "งานสกิม/ทาสี",
            reportName: "งานสกิมและทาสีห้องพัก",
            reportEmoji: "🎨",
            title: "STATUS งานสกิม / ทาสี",
            type: "progress",
            tasks: [
              { name: "สกิม", color: "bg-stone-400", textColor: "text-white" },
              { name: "ทาสี", color: "bg-sky-500", textColor: "text-white" },
            ],
          },
          topping: {
            name: "งานเท TOPPING",
            reportName: "งานเทปรับระดับพื้นห้องพัก",
            reportEmoji: "🏗️",
            title: "STATUS งานเท TOPPING",
            type: "progress",
            tasks: [
              {
                name: "จับปุ่ม/ขังน้ำ",
                color: "bg-orange-400",
                textColor: "text-white",
              },
              {
                name: "เท Topping",
                color: "bg-stone-500",
                textColor: "text-white",
              },
            ],
          },
          electrical: {
            name: "งานไฟฟ้า",
            reportName: "งานไฟฟ้า",
            reportEmoji: "⚡",
            title: "STATUS งานไฟฟ้า",
            type: "progress",
            tasks: [
              {
                name: "เดินท่อ",
                color: "bg-yellow-500",
                textColor: "text-black",
              },
              {
                name: "ร้อยสาย",
                color: "bg-yellow-600",
                textColor: "text-white",
              },
            ],
          },
          plumbing: {
            name: "งานประปา",
            reportName: "งานประปา",
            reportEmoji: "💧",
            title: "STATUS งานประปา",
            type: "progress",
            tasks: [
              {
                name: "เดินท่อ",
                color: "bg-blue-400",
                textColor: "text-white",
              },
              {
                name: "ทดสอบแรงดัน",
                color: "bg-blue-600",
                textColor: "text-white",
              },
            ],
          },
          airCon: {
            name: "งานแอร์",
            reportName: "งานแอร์",
            reportEmoji: "🌬️",
            title: "STATUS งานแอร์",
            type: "progress",
            tasks: [
              {
                name: "เดินท่อ",
                color: "bg-cyan-400",
                textColor: "text-black",
              },
              {
                name: "ติดตั้งเครื่อง",
                color: "bg-cyan-600",
                textColor: "text-white",
              },
            ],
          },
          ceiling: {
            name: "งานฝ้า",
            reportName: "งานติดตั้งฝ้า",
            reportEmoji: "🪜",
            title: "STATUS งานติดตั้งฝ้า",
            type: "multi-progress",
            tasks: [
              {
                name: "ห้องพัก (โครง)",
                key: "room_framing",
                shortName: "โครง(พ)",
                color: "bg-slate-500",
                textColor: "text-white",
              },
              {
                name: "ห้องพัก (แผ่น)",
                key: "room_board",
                shortName: "แผ่น(พ)",
                color: "bg-amber-400",
                textColor: "text-black",
              },
              {
                name: "ห้องน้ำ (โครง)",
                key: "bathroom_framing",
                shortName: "โครง(น)",
                color: "bg-slate-600",
                textColor: "text-white",
              },
              {
                name: "ห้องน้ำ (แผ่น)",
                key: "bathroom_board",
                shortName: "แผ่น(น)",
                color: "bg-amber-500",
                textColor: "text-black",
              },
              {
                name: "ตรวจเหนือฝ้า",
                key: "above_ceiling_inspection",
                shortName: "ตรวจเหนือฝ้า",
                color: "bg-sky-600",
                textColor: "text-white",
              },
            ],
          },
          texcaWall: {
            name: "งานผนัง TEXCA",
            reportName: "งานผนัง TEXCA",
            reportEmoji: "🧱",
            title: "STATUS งานผนัง TEXCA WALL",
            type: "progress",
            tasks: [
              { name: "ตีไลน์", color: "bg-red-500", textColor: "text-white" },
              { name: "เขิบ", color: "bg-stone-400", textColor: "text-white" },
              {
                name: "TEXCA",
                color: "bg-orange-300",
                textColor: "text-black",
              },
            ],
          },
          electricalRoughIn: {
            name: "งานไฟฟ้า",
            reportName: "ไฟฟ้า",
            reportEmoji: "⚡",
            title: "STATUS งานไฟฟ้า",
            type: "progress",
            tasks: [
              {
                name: "เดินท่อ",
                color: "bg-yellow-500",
                textColor: "text-black",
              },
              {
                name: "ร้อยสาย",
                color: "bg-yellow-600",
                textColor: "text-white",
              },
            ],
          },
          plumbingRoughIn: {
            name: "งานประปา",
            reportName: "ประปา",
            reportEmoji: "💧",
            title: "STATUS งานประปา",
            type: "progress",
            tasks: [
              {
                name: "เดินท่อ",
                color: "bg-blue-500",
                textColor: "text-black",
              },
              {
                name: "ทดสอบแรงดัน",
                color: "bg-blue-600",
                textColor: "text-white",
              },
            ],
          },
          airConRoughIn: {
            name: "งานแอร์",
            reportName: "แอร์",
            reportEmoji: "🌬️",
            title: "STATUS งานแอร์",
            type: "progress",
            tasks: [
              {
                name: "เดินท่อ",
                color: "bg-cyan-500",
                textColor: "text-black",
              },
              {
                name: "ติดตั้งเครื่อง",
                color: "bg-cyan-600",
                textColor: "text-white",
              },
            ],
          },
          waterproofing: {
            name: "งานกันซึม",
            reportName: "งานกันซึม",
            reportEmoji: "🛡️",
            title: "STATUS งานกันซึม",
            type: "multi-progress",
            tasks: [
              {
                name: "ห้องน้ำ",
                key: "bathroom",
                shortName: "น้ำ",
                color: "bg-indigo-500",
                textColor: "text-white",
              },
              {
                name: "ระเบียง",
                key: "balcony",
                shortName: "รบ.",
                color: "bg-cyan-500",
                textColor: "text-white",
              },
            ],
          },
          tiling: {
            name: "งานปูกระเบื้อง",
            reportName: "งานปูกระเบื้อง",
            reportEmoji: "🟧",
            title: "STATUS งานปูกระเบื้อง",
            type: "multi-progress",
            tasks: [
              {
                name: "ห้องน้ำ",
                key: "bathroom",
                shortName: "น้ำ",
                color: "bg-teal-500",
                textColor: "text-white",
              },
              {
                name: "ระเบียง",
                key: "balcony",
                shortName: "รบ.",
                color: "bg-lime-600",
                textColor: "text-white",
              },
              {
                name: "ครัว",
                key: "kitchen",
                shortName: "ครัว",
                color: "bg-rose-500",
                textColor: "text-white",
              },
            ],
          },
          aluminum: {
            name: "งานติดตั้งอลูมิเนียม",
            reportName: "งานติดตั้งอลูมิเนียม",
            reportEmoji: "🪟",
            title: "STATUS งานติดตั้งอลูมิเนียม",
            type: "multi-progress",
            tasks: [
              {
                name: "บานกั้นห้อง",
                key: "partition",
                shortName: "กั้น",
                color: "bg-slate-400",
                textColor: "text-white",
              },
              {
                name: "บานออกระเบียง",
                key: "balcony",
                shortName: "รบ.",
                color: "bg-blue-400",
                textColor: "text-white",
              },
              {
                name: "บานหน้าต่าง",
                key: "window",
                shortName: "นต.",
                color: "bg-sky-300",
                textColor: "text-black",
              },
            ],
          },
          aluminumPaint: {
            name: "งานเก็บสีอลูมิเนียม",
            reportName: "งานเก็บสีอลูมิเนียม",
            reportEmoji: "🖌️",
            title: "STATUS งานเก็บสีอลูมิเนียม",
            type: "progress",
            tasks: [
              {
                name: "ดำเนินการ",
                color: "bg-zinc-400",
                textColor: "text-white",
              },
              {
                name: "แล้วเสร็จ",
                color: "bg-zinc-600",
                textColor: "text-white",
              },
            ],
          },
          cleaning: {
            name: "งานทำความสะอาด",
            reportName: "งานทำความสะอาด",
            reportEmoji: "🧹",
            title: "STATUS งานทำความสะอาด",
            type: "progress",
            tasks: [
              {
                name: "ดำเนินการ",
                color: "bg-violet-400",
                textColor: "text-white",
              },
              {
                name: "แล้วเสร็จ",
                color: "bg-violet-600",
                textColor: "text-white",
              },
            ],
          },
          wetWork: {
            name: "คะแนน WET WORK",
            reportName: "WET WORK",
            reportEmoji: "💧",
            title: "STATUS งาน WET WORK",
            type: "inspection",
            tasks: [
              {
                name: "CM WW",
                color: "bg-orange-400",
                textColor: "text-white",
              },
              {
                name: "QC WW",
                color: "bg-yellow-400",
                textColor: "text-black",
              },
            ],
          },
          furniture: {
            name: "งานติดตั้งเฟอร์นิเจอร์",
            reportName: "งานติดตั้งเฟอร์นิเจอร์",
            reportEmoji: "🛋️",
            title: "STATUS งานติดตั้งเฟอร์นิเจอร์",
            type: "progress",
            tasks: [
              {
                name: "ติดตั้งชุดครัว",
                color: "bg-amber-500",
                textColor: "text-white",
              },
              {
                name: "ติดตั้งเฟอร์นิเจอร์",
                color: "bg-amber-700",
                textColor: "text-white",
              },
            ],
          },
          laminate: {
            name: "งานปูพื้นไม้ลามิเนต",
            reportName: "งานปูพื้นไม้ลามิเนต",
            reportEmoji: "🪵",
            title: "STATUS งานปูพื้นไม้ลามิเนต",
            type: "progress",
            tasks: [
              {
                name: "ตรวจรับพื้นที่",
                color: "bg-yellow-400",
                textColor: "text-black",
              },
              {
                name: "ปูพื้นไม้",
                color: "bg-amber-800",
                textColor: "text-white",
              },
            ],
          },
          door: {
            name: "งานติดตั้งประตูไม้",
            reportName: "งานติดตั้งประตูไม้",
            reportEmoji: "🚪",
            title: "STATUS งานติดตั้งประตูไม้",
            type: "multi-progress",
            tasks: [
              {
                name: "ประตูหน้า",
                key: "front",
                shortName: "หน้า",
                color: "bg-amber-600",
                textColor: "text-white",
              },
              {
                name: "ประตูห้องนอน",
                key: "bedroom",
                shortName: "นอน",
                color: "bg-emerald-600",
                textColor: "text-white",
                condition: (f, r) => hasBedroomDoor(f, r),
              },
              {
                name: "ประตูห้องน้ำ",
                key: "bathroom",
                shortName: "น้ำ",
                color: "bg-blue-400",
                textColor: "text-white",
              },
              {
                name: "อุปกรณ์ประตู",
                key: "hardware",
                shortName: "อปก.",
                color: "bg-cyan-600",
                textColor: "text-white",
              },
            ],
          },
          showerScreen: {
            name: "งาน SHOWER SCREEN",
            reportName: "งาน SHOWER SCREEN",
            reportEmoji: "🚿",
            title: "STATUS งาน SHOWER SCREEN",
            type: "progress",
            tasks: [
              {
                key: "inspection",
                name: "ตรวจรับพื้นที่",
                color: "bg-yellow-400",
                textColor: "text-black",
              },
              {
                key: "install",
                name: "ติดตั้ง",
                color: "bg-sky-500",
                textColor: "text-white",
              },
              {
                key: "finish",
                name: "เก็บงาน",
                color: "bg-teal-400",
                textColor: "text-white",
              },
            ],
          },
          endProduct: {
            name: "คะแนน END PRODUCT",
            reportName: "END PRODUCT",
            reportEmoji: "🏁",
            title: "STATUS งาน END PRODUCT",
            type: "inspection",
            tasks: [
              { name: "CM End", color: "bg-rose-300", textColor: "text-black" },
              {
                name: "QC End",
                color: "bg-emerald-400",
                textColor: "text-black",
              },
            ],
          },
        };

        const commonAreaDefinitions = {
          staircase1: {
            locationName: "บันได ST1",
            tasks: [
              { taskName: "ฉาบผนัง" },
              { taskName: "เทปรับระดับ ขัดมัน" },
              { taskName: "งานฉาบท้องบันได" },
              { taskName: "สกิมทาสี ผนัง" },
              { taskName: "ราวบันได" },
            ],
          },
          staircase2: {
            locationName: "บันได ST2",
            tasks: [
              { taskName: "ฉาบผนัง" },
              { taskName: "เทปรับระดับ ขัดมัน" },
              { taskName: "งานฉาบท้องบันได" },
              { taskName: "สกิมทาสี ผนัง" },
              { taskName: "ราวบันได" },
            ],
          },
          electricalRoom: {
            locationName: "ห้องไฟฟ้า",
            tasks: [
              { taskName: "งานตั้งผนัง texca wall" },
              { taskName: "ฉาบแต่งห้องพื้น" },
              { taskName: "ทาสี" },
              { taskName: "เทปูนระดับ" },
            ],
          },
          garbageRoom: {
            locationName: "ห้องขยะ",
            tasks: [
              { taskName: "งานก่อผนัง" },
              { taskName: "ฉาบแต่งห้องพื้น" },
              { taskName: "ทาสี" },
              { taskName: "ปูกระเบื้อง" },
            ],
          },
          lift: {
            locationName: "LIFT",
            tasks: [
              { taskName: "เท Door jam" },
              { taskName: "งานฉาบผนัง หน้าลิฟท์" },
              { taskName: "งานสกิมทาสีผนัง หน้าลิฟท์" },
            ],
          },
          hallway: {
            locationName: "ทางเดิน",
            tasks: [
              { taskName: "ติดบานชาร์ป" },
              { taskName: "ฝ้า" },
              { taskName: "กระเบื้อง" },
            ],
          },
        };

        // --- STATE VARIABLES ---
        let projectData = {};
        let showExecutiveSummary = false;
        let currentView = "residential";
        let currentCategory = "skimAndPaint";
        let isDetailedViewActive = false;
        let summaryReportMode = "wetWork"; // 'wetWork' or 'endProduct'
        let reportHeaderStyle = "dark"; // 'dark' or 'light'
        let showOverallProgressCard = true;
        let summaryReportSelectedFloors = [2]; // Default to floor 2
        let isMultiFloorSelectionEnabled = false;
        let showMajorDefectHighlight = false;
        let currentQuickUpdateRoom = { floor: null, room: null };
        let isSelecting = false;
        let selectedCells = new Set();
        let confirmCallback = null;
        let toastTimeout;
        let realtimeChannel;
        let lastFocusedElement;
        let activeModal = null;
        let ai;

        // --- DATA HANDLING (Supabase) ---
        async function setupRealtimeListenerAndInitApp() {
          const splashLoadingText = document.getElementById(
            "splash-loading-text",
          );
          splashLoadingText.textContent = "กำลังดึงข้อมูลล่าสุด...";

          const { data, error } = await supabaseClient
            .from(CONFIG.DB_TABLE_NAME)
            .select("data")
            .eq("id", CONFIG.DB_ROW_ID)
            .single();

          if (error && error.code !== "PGRST116") {
            console.error("Error fetching initial data:", error);
            showNotificationModal(
              "Supabase Error",
              "ไม่สามารถดึงข้อมูลเริ่มต้นได้: " + error.message,
            );
            splashLoadingText.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อ";
            return;
          }

          if (data && Object.keys(data.data).length > 0) {
            projectData = data.data;
            // Load schedule data if it exists in projectData
            if (projectData.globalScheduleData)
              globalScheduleData = projectData.globalScheduleData;
            if (projectData.globalScheduleTasks) {
              globalScheduleTasks = projectData.globalScheduleTasks;

              // Patch for U32 and U33 swap (if loaded from old DB data)
              const u32Index = globalScheduleTasks.findIndex(
                (t) => t.subName === "U32",
              );
              const u33Index = globalScheduleTasks.findIndex(
                (t) => t.subName === "U33",
              );
              if (u32Index !== -1 && u33Index !== -1) {
                if (
                  globalScheduleTasks[u32Index].name.includes(
                    "งานเฟอร์นิเจอร์",
                  ) &&
                  globalScheduleTasks[u33Index].name.includes("Shower Screen")
                ) {
                  const tempName = globalScheduleTasks[u32Index].name;
                  globalScheduleTasks[u32Index].name =
                    globalScheduleTasks[u33Index].name;
                  globalScheduleTasks[u33Index].name = tempName;

                  // Save the patched data back
                  saveProjectDataToDB();
                }
              }
            }
            if (projectData.globalScheduleSettings)
              globalScheduleSettings = projectData.globalScheduleSettings;
            if (projectData.globalScheduleFilters) {
              globalScheduleFilters = projectData.globalScheduleFilters;
            }

            // Ensure settings UI matches the loaded database parameters
            if (typeof renderScheduleSettings === "function") {
              renderScheduleSettings();
            }

            // Safety check: Ensure maxFloor matches the actual data loaded
            if (globalScheduleData.length > 0) {
              const actualMax =
                globalScheduleData[globalScheduleData.length - 1].id;
              if (globalScheduleFilters.maxFloor < actualMax) {
                globalScheduleFilters.maxFloor = actualMax;
              }
            }
          } else {
            console.log(
              "No data or empty data in Supabase, creating/updating initial document...",
            );
            splashLoadingText.textContent =
              "ไม่พบข้อมูล, กำลังสร้างเอกสารเริ่มต้น...";
            projectData = generateInitialDataObject();

            if (data) {
              // Row exists but is empty, update it
              const { error: updateError } = await supabaseClient
                .from(CONFIG.DB_TABLE_NAME)
                .update({ data: projectData })
                .eq("id", CONFIG.DB_ROW_ID);
              if (updateError) {
                console.error("Error updating initial document:", updateError);
                showNotificationModal(
                  "Supabase Error",
                  "ไม่สามารถอัพเดทข้อมูลเริ่มต้นได้",
                );
                return;
              }
            } else {
              // Row doesn't exist, insert it
              const { error: insertError } = await supabaseClient
                .from(CONFIG.DB_TABLE_NAME)
                .insert({ id: CONFIG.DB_ROW_ID, data: projectData });

              if (insertError) {
                console.error("Error creating initial document:", insertError);
                showNotificationModal(
                  "Supabase Error",
                  "ไม่สามารถสร้างข้อมูลเริ่มต้นได้ กรุณาตรวจสอบว่าสร้างตารางถูกต้อง",
                );
                splashLoadingText.textContent =
                  "เกิดข้อผิดพลาดในการสร้างข้อมูล";
                return;
              }
            }
            showToast("สร้างฐานข้อมูลเริ่มต้นสำเร็จ");
          }

          renderSplashScreen();
          const now = new Date();
          const dateStr = now.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const timeStr = now.toLocaleTimeString("th-TH");
          splashLoadingText.textContent = `อัพเดทข้อมูลล่าสุด วันที่ ${dateStr} เวลา ${timeStr}`;

          if (realtimeChannel) {
            realtimeChannel.unsubscribe();
          }

          realtimeChannel = supabaseClient
            .channel("project-data-channel")
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: CONFIG.DB_TABLE_NAME,
                filter: `id=eq.${CONFIG.DB_ROW_ID}`,
              },
              (payload) => {
                console.log("Realtime update received!", payload);
                const oldDataStr = JSON.stringify(projectData);
                const newDataStr = JSON.stringify(payload.new.data);

                // Ignore if the data is exactly the same (e.g. we just updated it ourselves)
                if (oldDataStr === newDataStr) {
                  return;
                }

                const oldData = JSON.parse(oldDataStr); // Deep copy
                projectData = payload.new.data;

                // Sync local schedule variables from the new projectData
                if (projectData.globalScheduleData)
                  globalScheduleData = projectData.globalScheduleData;
                if (projectData.globalScheduleTasks)
                  globalScheduleTasks = projectData.globalScheduleTasks;
                if (projectData.globalScheduleSettings)
                  globalScheduleSettings = projectData.globalScheduleSettings;
                if (projectData.globalScheduleFilters)
                  globalScheduleFilters = projectData.globalScheduleFilters;

                // If main app is open, render it. If not, just update splash
                if (
                  !document
                    .getElementById("main-app-container")
                    .classList.contains("hidden")
                ) {
                  renderTable();
                  highlightChanges(oldData, projectData);
                } else if (
                  !document
                    .getElementById("quick-update-mode-container")
                    .classList.contains("hidden")
                ) {
                  renderQuickUpdateTaskList(); // Also update quick update mode if it's active
                }
                renderSplashScreen();
                const updateNow = new Date();
                const updateDateStr = updateNow.toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const updateTimeStr = updateNow.toLocaleTimeString("th-TH");
                document.getElementById("splash-loading-text").textContent =
                  `อัพเดทข้อมูลล่าสุด วันที่ ${updateDateStr} เวลา ${updateTimeStr}`;
                showToast("ข้อมูลถูกอัพเดทโดยผู้ใช้อื่น", 2500);
              },
            )
            .subscribe((status, err) => {
              if (status === "SUBSCRIBED") {
                splashLoadingText.textContent = `เชื่อมต่อ Real-time สำเร็จ!`;
                setTimeout(() => {
                  if (
                    document
                      .getElementById("main-app-container")
                      .classList.contains("hidden") &&
                    document
                      .getElementById("quick-update-mode-container")
                      .classList.contains("hidden")
                  ) {
                    const subNow = new Date();
                    const subDateStr = subNow.toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                    const subTimeStr = subNow.toLocaleTimeString("th-TH");
                    splashLoadingText.textContent = `อัพเดทข้อมูลล่าสุด วันที่ ${subDateStr} เวลา ${subTimeStr}`;
                  }
                }, 2000);
              }
              if (status === "CHANNEL_ERROR") {
                console.warn("Realtime channel error:", err);
                // Supabase will automatically attempt to reconnect. 
                // We show a non-intrusive toast instead of a blocking modal.
                showToast("การเชื่อมต่อ Real-time ขัดข้อง กำลังเชื่อมต่อใหม่...", 3000);
              }
            });
        }

        function generateInitialDataObject() {
          const data = {};
          Object.keys(taskDefinitions).forEach((catKey) => {
            const catDef = taskDefinitions[catKey];
            data[catKey] = {};
            CONFIG.FLOORS.forEach((floor) => {
              data[catKey][floor] = {};
              const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
              for (let room = 1; room <= roomsOnThisFloor; room++) {
                data[catKey][floor][room] = {};
                const unitData = data[catKey][floor][room];
                if (catDef.type === "inspection") {
                  unitData.cmScore = 0;
                  unitData.qcScore = 0;
                  unitData.cmHasMajorDefect = false;
                  unitData.qcHasMajorDefect = false;
                  unitData.inInspection = false;
                } else if (catDef.type === "multi-progress") {
                  catDef.tasks.forEach((task) => {
                    unitData[`progress_${task.key}`] = 0;
                  });
                } else {
                  unitData.taskIndex = 0;
                  unitData.progress = 0;
                }
              }
            });
          });
          data.plans = {};
          CONFIG.FLOORS.forEach((floor) => {
            data.plans[floor] = {};
            const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
            for (let room = 1; room <= roomsOnThisFloor; room++) {
              data.plans[floor][room] = {};
            }
          });
          data.commonArea = {};
          Object.keys(commonAreaDefinitions).forEach((locKey) => {
            data.commonArea[locKey] = {};
            const locDef = commonAreaDefinitions[locKey];
            data.commonArea[locKey].tasks = {};
            locDef.tasks.forEach((task, taskIndex) => {
              data.commonArea[locKey].tasks[taskIndex] = {};
              const taskData = data.commonArea[locKey].tasks[taskIndex];
              taskData.progress = {};
              CONFIG.COMMON_AREA_FLOORS.forEach((floor) => {
                taskData.progress[floor] = 0;
              });
            });
          });

          // Initialize schedule data in projectData
          data.globalScheduleData = globalScheduleData;
          data.globalScheduleTasks = globalScheduleTasks;
          data.globalScheduleSettings = globalScheduleSettings;
          data.globalScheduleFilters = globalScheduleFilters;

          return data;
        }

        // --- SPLASH SCREEN LOGIC ---
        window.toggleOverallProgressCard = function () {
          showOverallProgressCard = !showOverallProgressCard;

          // Update the button in unified controls if it exists
          const btn = document.getElementById("overall-progress-toggle-btn");
          const text = document.getElementById("overall-progress-toggle-text");
          const icon = document.getElementById("overall-progress-toggle-icon");

          if (btn && text && icon) {
            text.textContent = showOverallProgressCard
              ? "ซ่อนกราฟความก้าวหน้า"
              : "แสดงกราฟความก้าวหน้า";
            icon.setAttribute(
              "data-lucide",
              showOverallProgressCard ? "eye-off" : "eye",
            );
            if (window.lucide) lucide.createIcons();
          }

          renderExecutiveSummaryDashboard();
          renderTable(); // Also re-render table if needed
        };

        function renderScheduleExecutiveSummary(dashboard) {
          let totalTasks = 0;
          let completedTasks = 0;
          let delayedTasks = [];
          let inProgressTasks = [];
          let floorReports = [];

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const visibleTasks = globalScheduleTasks
            .map((task, index) => ({ task, index }))
            .filter(({ task, index }) => {
              if (
                task.category === "wetwork" &&
                !globalScheduleFilters.showWetWork
              )
                return false;
              if (
                task.category === "endproduct" &&
                !globalScheduleFilters.showEndProduct
              )
                return false;
              if (globalScheduleFilters.hiddenTasks.includes(index))
                return false;
              return true;
            });

          globalScheduleData
            .filter(
              (f) =>
                f.id >= globalScheduleFilters.minFloor &&
                f.id <= globalScheduleFilters.maxFloor,
            )
            .forEach((floor) => {
              let floorDelayed = [];
              let floorInProgress = [];
              let floorNotStarted = [];
              let isAllDone = true;

              visibleTasks.forEach((t) => {
                const task = t.task;
                const taskIndex = t.index;
                totalTasks++;
                const actualStart = floor.actual[taskIndex * 2];
                const actualEnd = floor.actual[taskIndex * 2 + 1];
                const planStartStr = floor.plan[taskIndex * 2];
                const planEndStr = floor.plan[taskIndex * 2 + 1];

                const isDone = actualStart === "DONE" || actualEnd === "DONE";
                if (!isDone) isAllDone = false;

                if (!isDone && planEndStr) {
                  const planEndDate = new Date(planEndStr);
                  planEndDate.setHours(0, 0, 0, 0);

                  const taskNameRaw =
                    task.subName +
                    " " +
                    task.name.replace(/\s*\(\d+\s*วัน\)/, "");

                  if (planEndDate < today) {
                    const diffDays = Math.ceil(
                      (today - planEndDate) / (1000 * 60 * 60 * 24),
                    );
                    delayedTasks.push(`ชั้น ${floor.id}: ${task.subName}`);
                    floorDelayed.push({ name: taskNameRaw, days: diffDays });
                  } else if (planStartStr) {
                    const planStartDate = new Date(planStartStr);
                    planStartDate.setHours(0, 0, 0, 0);
                    if (planStartDate <= today && planEndDate >= today) {
                      inProgressTasks.push(`ชั้น ${floor.id}: ${task.subName}`);
                      floorInProgress.push({
                        name: taskNameRaw,
                        endStr: formatThaiDateShort(planEndStr),
                      });
                    } else if (planStartDate > today) {
                      const daysUntil = Math.ceil(
                        (planStartDate - today) / (1000 * 60 * 60 * 24),
                      );
                      floorNotStarted.push({
                        name: taskNameRaw,
                        startStr: formatThaiDateShort(planStartStr),
                        daysUntil,
                        startDate: planStartDate,
                      });
                    }
                  }
                } else if (isDone) {
                  completedTasks++;
                }
              });

              // Generate professional report for this floor
              if (isAllDone) {
                floorReports.push(`
                            <div class="flex items-start gap-4 p-3 rounded-lg border border-slate-100 bg-emerald-50/30">
                                <div class="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                                    ${floor.id}
                                </div>
                                <div class="flex-grow">
                                    <div class="flex justify-between items-start mb-1">
                                        <h4 class="font-bold text-slate-800">ชั้น ${floor.id}</h4>
                                        <span class="text-xs text-emerald-600 font-bold">เสร็จสมบูรณ์</span>
                                    </div>
                                    <p class="text-sm text-slate-600 italic">งานทั้งหมดในหมวดที่เลือกดำเนินการเสร็จสิ้นแล้ว</p>
                                </div>
                            </div>
                        `);
              } else if (floorDelayed.length > 0) {
                const totalDays = floorDelayed.reduce(
                  (max, t) => Math.max(max, t.days),
                  0,
                );
                floorReports.push(`
                            <div class="flex items-start gap-5 p-5 rounded-xl border border-rose-100 bg-rose-50/20 shadow-sm">
                                <div class="flex-shrink-0 w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-2xl shadow-inner">
                                    ${floor.id}
                                </div>
                                <div class="flex-grow min-w-0">
                                    <div class="flex justify-between items-start mb-2 gap-2">
                                        <h4 class="text-xl font-black text-slate-800">ชั้น ${floor.id}</h4>
                                        <span class="text-sm px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black shrink-0">ล่าช้ากว่าแผน</span>
                                    </div>
                                    <p class="text-sm text-rose-700 font-bold mb-2">ล่าช้ารวม ${totalDays} วัน</p>
                                    <ul class="text-base text-slate-700 list-disc pl-5 space-y-1.5 font-medium">
                                        ${floorDelayed.map((t) => `<li class="break-words whitespace-normal">${t.name} <span class="text-rose-600 font-bold">(ช้า ${t.days} วัน)</span></li>`).join("")}
                                    </ul>
                                </div>
                            </div>
                        `);
              } else if (floorInProgress.length > 0) {
                floorReports.push(`
                            <div class="flex items-start gap-5 p-5 rounded-xl border border-indigo-100 bg-indigo-50/20 shadow-sm">
                                <div class="flex-shrink-0 w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl shadow-inner">
                                    ${floor.id}
                                </div>
                                <div class="flex-grow min-w-0">
                                    <div class="flex justify-between items-start mb-2 gap-2">
                                        <h4 class="text-xl font-black text-slate-800">ชั้น ${floor.id}</h4>
                                        <span class="text-sm px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-black shrink-0">กำลังดำเนินการ</span>
                                    </div>
                                    <ul class="text-base text-slate-700 list-disc pl-5 space-y-1.5 font-medium">
                                        ${floorInProgress.map((t) => `<li class="break-words whitespace-normal">${t.name} <span class="text-slate-500 font-semibold">(ครบกำหนด: ${t.endStr})</span></li>`).join("")}
                                    </ul>
                                </div>
                            </div>
                        `);
              } else if (floorNotStarted.length > 0) {
                // Sort to find the earliest task to start
                floorNotStarted.sort((a, b) => a.startDate - b.startDate);
                const firstTask = floorNotStarted[0];
                floorReports.push(`
                            <div class="flex items-start gap-5 p-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                                <div class="flex-shrink-0 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-2xl shadow-inner">
                                    ${floor.id}
                                </div>
                                <div class="flex-grow min-w-0">
                                    <div class="flex justify-between items-start mb-2 gap-2">
                                        <h4 class="text-xl font-black text-slate-800">ชั้น ${floor.id}</h4>
                                        <span class="text-sm px-2 py-0.5 bg-slate-100 rounded-full text-slate-500 font-semibold shrink-0">ยังไม่ถึงกำหนดเริ่มงาน</span>
                                    </div>
                                    <p class="text-sm text-slate-700 mb-1.5 font-medium">
                                        กำหนดเริ่มงานแรก: <span class="font-bold text-slate-800 break-words line-clamp-1 truncate block mt-1">${firstTask.name}</span>
                                    </p>
                                    <p class="text-sm text-indigo-600 font-bold">เริ่มวันที่ ${firstTask.startStr} <span class="text-slate-500 font-medium">(เหลืออีก ${firstTask.daysUntil} วัน)</span></p>
                                </div>
                            </div>
                        `);
              }
            });

          // Calculate overall progress from room-level data to match sub-tables
          let actualTotalProgressPoints = 0;
          let actualTotalMaxPoints = 0;

          const catsToSum = [];
          if (globalScheduleFilters.showWetWork) catsToSum.push("wetWork");
          if (globalScheduleFilters.showEndProduct) catsToSum.push("endProduct");

          let minF = globalScheduleFilters.minFloor;
          let maxF = globalScheduleFilters.maxFloor;

          catsToSum.forEach((catKey) => {
            const catDef = taskDefinitions[catKey];
            if (!catDef) return;
            
            for (let floor = minF; floor <= maxF; floor++) {
              // Ensure this floor is actually in the filtered data before counting
              const hasFloorInSchedule = globalScheduleData.some(f => f.id === floor);
              if (!hasFloorInSchedule) continue;

              const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
              for (let room = 1; room <= roomsOnThisFloor; room++) {
                const unitData = projectData[catKey]?.[floor]?.[room] || {};
                if (catDef.type === "progress") {
                  const applicableTasks = catDef.tasks.filter(
                    (t) => !t.condition || t.condition(floor, room),
                  );
                  const taskCount = applicableTasks.length;
                  if (taskCount > 0) {
                      const taskProg = (unitData.progress || 0) / taskCount;
                      const completedTasksProgress =
                        (unitData.taskIndex || 0) * (100 / taskCount);
                      actualTotalProgressPoints += taskProg + completedTasksProgress;
                      actualTotalMaxPoints += 100;
                  }
                } else if (catDef.type === "multi-progress") {
                  let subTaskTotal = 0;
                  let applicableTaskCount = 0;
                  catDef.tasks.forEach((task) => {
                    if (task.condition && !task.condition(floor, room)) return;
                    applicableTaskCount++;
                    subTaskTotal += unitData[`progress_${task.key}`] || 0;
                  });
                  actualTotalProgressPoints +=
                    applicableTaskCount > 0
                      ? subTaskTotal / applicableTaskCount
                      : 0;
                  if (applicableTaskCount > 0) {
                      actualTotalMaxPoints += 100;
                  }
                } else if (catDef.type === "inspection" || catDef.type === "qc_defect" || catKey === "endProduct") {
                  let score = 0;
                  // For endProduct specifically
                  if (catKey === "endProduct") {
                     score = unitData.qcScore >= 85 ? 100 : (unitData.qcScore > 0 ? unitData.qcScore : 0);
                  } else {
                     score = unitData.qcScore > 0
                      ? unitData.qcScore
                      : unitData.cmScore || 0;
                  }
                  actualTotalProgressPoints += score;
                  actualTotalMaxPoints += 100;
                }
              }
            }
          });

          // Compute exact matching progress
          const overallProgress =
            actualTotalMaxPoints > 0
              ? Math.round((actualTotalProgressPoints / actualTotalMaxPoints) * 100)
              : 0;

          const formattedToday = today.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          dashboard.innerHTML = `
                    <div class="bg-white rounded-2xl border-2 border-black overflow-hidden">
                        <div class="bg-white px-8 py-7 flex justify-between items-center text-slate-900 border-b-2 border-black">
                            <div>
                                <h2 class="text-2xl font-black flex items-center gap-3 tracking-tight">
                                    <div class="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                                    </div>
                                    รายงานสรุปสถานะโครงการ (EXECUTIVE STATUS REPORT)
                                </h2>
                                <p class="text-slate-500 text-sm mt-1 font-medium">สรุปภาพรวมความคืบหน้าและติดตามสถานะงานรายชั้น</p>
                            </div>
                            <div class="text-right">
                                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                                    REPORT DATE: ${formattedToday}
                                </span>
                            </div>
                        </div>
                        
                        <div class="p-8 bg-white">
                            <div>
                                <!-- Right Column: Floor by Floor Report -->
                                <div>
                                    <div class="flex items-center justify-between mb-8 border-b-2 border-black pb-4">
                                        <h3 class="text-lg font-black text-slate-900 flex items-center gap-3">
                                            <div class="w-2 h-6 bg-indigo-600 rounded-full"></div>
                                            รายละเอียดสถานะงานรายชั้น (Floor-by-Floor Status)
                                        </h3>
                                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Floors Only</span>
                                    </div>
                                    
                                    <div id="floor-by-floor-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                                        ${floorReports.join("")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
        }

        function renderExecutiveSummaryDashboard() {
          const dashboard = document.getElementById(
            "executive-summary-dashboard",
          );
          const isResidentialOrSchedule =
            currentView === "residential" || currentView === "schedule";

          if (!showExecutiveSummary || !isResidentialOrSchedule) {
            dashboard.classList.add("hidden");
            return;
          }
          dashboard.classList.remove("hidden");

          if (currentView === "schedule") {
            renderScheduleExecutiveSummary(dashboard);
            return;
          }

          let taskKey = currentCategory;

          const catDef = taskDefinitions[taskKey];
          if (!catDef) return;

          let totalCompletedRooms = 0;
          let totalProgressPoints = 0;
          let totalInProgress = 0;
          let totalNotStarted = 0;
          let floorStats = {};
          let subTaskStats = {};
          let floorTaskStatus = {};

          // Initialize subtask stats
          catDef.tasks.forEach((t) => {
            subTaskStats[t.key || t.name] = {
              count: 0,
              total: 0,
              inProgress: 0,
              progressSum: 0,
            };
          });

          CONFIG.FLOORS.forEach((f) => {
            floorTaskStatus[f] = {};
            catDef.tasks.forEach((t) => {
              floorTaskStatus[f][t.key || t.name] = {
                total: 0,
                completed: 0,
                inProgress: 0,
                progressSum: 0,
                name: t.name,
              };
            });
          });

          CONFIG.FLOORS.forEach((floor) => {
            let floorCompleted = 0;
            let floorTotalProgressPoints = 0;
            let floorTotal = CONFIG.getRoomsOnFloor(floor);

            for (let room = 1; room <= floorTotal; room++) {
              const unitData = projectData[taskKey]?.[floor]?.[room] || {};
              let progress = 0;

              if (catDef.type === "progress") {
                const applicableTasks = catDef.tasks.filter(
                  (t) => !t.condition || t.condition(floor, room),
                );
                const taskCount = applicableTasks.length;

                // Calculate subtask completions for Task Breakdown
                catDef.tasks.forEach((t, idx) => {
                  if (t.condition && !t.condition(floor, room)) return;
                  subTaskStats[t.key || t.name].total++;
                  floorTaskStatus[floor][t.key || t.name].total++;

                  let taskProgPercentage = 0;
                  if (unitData.taskIndex > idx) {
                    taskProgPercentage = 100;
                  } else if (unitData.taskIndex === idx) {
                    taskProgPercentage = unitData.progress || 0;
                  }
                  
                  subTaskStats[t.key || t.name].progressSum += taskProgPercentage;
                  floorTaskStatus[floor][t.key || t.name].progressSum += taskProgPercentage;

                  const isCompleted = taskProgPercentage >= 100;
                  const isInProgress = taskProgPercentage > 0 && taskProgPercentage < 100;

                  if (isCompleted) {
                    subTaskStats[t.key || t.name].count++;
                    floorTaskStatus[floor][t.key || t.name].completed++;
                  } else if (isInProgress) {
                    subTaskStats[t.key || t.name].inProgress++;
                    floorTaskStatus[floor][t.key || t.name].inProgress++;
                  }
                });

                const taskProg = (unitData.progress || 0) / taskCount;
                const completedTasksProgress =
                  (unitData.taskIndex || 0) * (100 / taskCount);
                progress = taskProg + completedTasksProgress;
              } else if (catDef.type === "multi-progress") {
                let subTaskTotal = 0;
                let appCount = 0;
                catDef.tasks.forEach((task) => {
                  if (task.condition && !task.condition(floor, room)) return;
                  appCount++;
                  const subProg = unitData[`progress_${task.key}`] || 0;
                  subTaskTotal += subProg;

                  subTaskStats[task.key].total++;
                  floorTaskStatus[floor][task.key || task.name].total++;
                  
                  subTaskStats[task.key].progressSum += subProg;
                  floorTaskStatus[floor][task.key || task.name].progressSum += subProg;

                  if (subProg >= 100) {
                    subTaskStats[task.key].count++;
                    floorTaskStatus[floor][task.key || task.name].completed++;
                  } else if (subProg > 0) {
                    subTaskStats[task.key].inProgress++;
                    floorTaskStatus[floor][task.key || task.name].inProgress++;
                  }
                });
                progress = appCount > 0 ? subTaskTotal / appCount : 0;
              } else if (catDef.type === "inspection") {
                progress =
                  unitData.qcScore > 0
                    ? unitData.qcScore
                    : unitData.cmScore || 0;
                // For inspection, we don't really have subtasks in the same way, but let's just use the main tasks
                catDef.tasks.forEach((t) => {
                  subTaskStats[t.key || t.name].total++;
                  floorTaskStatus[floor][t.key || t.name].total++;
                  
                  subTaskStats[t.key || t.name].progressSum += progress;
                  floorTaskStatus[floor][t.key || t.name].progressSum += progress;

                  if (progress >= 100) {
                    subTaskStats[t.key || t.name].count++;
                    floorTaskStatus[floor][t.key || t.name].completed++;
                  } else if (progress > 0) {
                    subTaskStats[t.key || t.name].inProgress++;
                    floorTaskStatus[floor][t.key || t.name].inProgress++;
                  }
                });
              }

              floorTotalProgressPoints += progress;

              if (progress >= 100) {
                floorCompleted++;
              } else if (progress > 0) {
                totalInProgress++;
              } else {
                totalNotStarted++;
              }
            }

            let floorProg = Math.round(floorTotalProgressPoints / floorTotal);
            if (floorProg === 100 && floorTotalProgressPoints < floorTotal * 100) {
              floorProg = 99;
            }
            floorStats[floor] = {
              completed: floorCompleted,
              total: floorTotal,
              progress: floorProg,
            };
            totalCompletedRooms += floorCompleted;
            totalProgressPoints += floorTotalProgressPoints;
          });

          const totalUnits = CONFIG.TOTAL_UNITS;
          let overallProgressRaw = (totalProgressPoints / totalUnits);
          let overallProgress = overallProgressRaw.toFixed(1);
          if (overallProgress === "100.0" && totalProgressPoints < totalUnits * 100) {
            overallProgress = "99.9";
          }
          const remainingUnits = totalUnits - totalCompletedRooms;

          // Determine status badge
          let statusBadge = "JUST STARTED";
          if (parseFloat(overallProgress) >= 100) statusBadge = "COMPLETED";
          else if (parseFloat(overallProgress) > 50)
            statusBadge = "IN PROGRESS";
          else if (parseFloat(overallProgress) > 0)
            statusBadge = "JUST STARTED";

          dashboard.innerHTML = `
                    <div class="flex flex-col lg:flex-row gap-6 items-stretch">
                        <!-- Left Main Box -->
                        <div class="flex-1 bg-white rounded-[2rem] overflow-hidden border-2 border-black flex flex-col">
                            <!-- Header -->
                            <div class="bg-white p-4 px-6 flex justify-between items-center border-b border-black">
                                <h2 class="text-black font-bold text-sm md:text-base tracking-wider uppercase">รายงานสรุปผลการดำเนินงาน (EXECUTIVE SUMMARY)</h2>
                            </div>
                            
                            <div class="p-6 flex-1 flex flex-col md:flex-row gap-8">
                                <!-- Task Breakdown -->
                                <div class="w-full md:w-[40%]">
                                    <h3 class="text-[#94a3b8] font-black text-xl mb-6 tracking-widest uppercase">TASK BREAKDOWN</h3>
                                    <div class="space-y-6">
                                        ${catDef.tasks
                                          .map((t) => {
                                            const stats =
                                              subTaskStats[t.key || t.name];
                                            const perc =
                                              stats.total > 0
                                                ? (stats.progressSum /
                                                      stats.total)
                                                : 0;
                                            return `
                                                <div class="flex items-end justify-between border-b border-slate-100 pb-2">
                                                    <span class="text-slate-700 font-bold text-lg">${t.name}</span>
                                                    <div class="flex items-baseline gap-4">
                                                        <span class="text-slate-900 font-black text-xl">${stats.count} <span class="text-sm font-bold text-slate-400">ห้อง</span></span>
                                                        <span class="text-indigo-500 font-bold text-sm w-12 text-right">${perc.toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            `;
                                          })
                                          .join("")}
                                    </div>
                                    
                                    <div class="mt-10">
                                        <div class="flex justify-between items-center bg-[#eff6ff] p-4 rounded-2xl border border-[#dbeafe] mb-4">
                                            <div>
                                                <p class="text-indigo-600 font-black text-lg">กำลังดำเนินการ</p>
                                                <p class="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">IN PROGRESS STATUS</p>
                                            </div>
                                            <div class="bg-white px-4 py-2 rounded-xl shadow-sm border border-indigo-100">
                                                <span class="text-indigo-600 font-black text-lg">${totalInProgress}</span>
                                                <span class="text-[10px] text-indigo-300 font-bold ml-1 uppercase">UNITS</span>
                                            </div>
                                        </div>
                                        <div class="space-y-2 pl-2">
                                            ${catDef.tasks
                                              .map((t) => {
                                                const stats =
                                                  subTaskStats[t.key || t.name];
                                                if (stats.inProgress > 0) {
                                                  return `
                                                        <div class="flex justify-between items-center text-sm">
                                                            <span class="text-slate-600 font-medium">${t.name}</span>
                                                            <span class="text-indigo-600 font-bold">${stats.inProgress} <span class="text-xs text-slate-400 font-normal">ห้อง</span></span>
                                                        </div>
                                                    `;
                                                }
                                                return "";
                                              })
                                              .join("")}
                                        </div>
                                    </div>
                                </div>

                                <!-- Floor Progress Breakdown -->
                                <div id="floor-progress-breakdown-container" class="w-full md:w-[60%] border-l border-slate-100 pl-8 overflow-y-auto max-h-[600px] custom-scrollbar">
                                    <h3 class="text-[#94a3b8] font-black text-xl mb-6 tracking-widest uppercase">FLOOR PROGRESS BREAKDOWN</h3>
                                    <div class="space-y-4">
                                        ${CONFIG.FLOORS.map((floor) => {
                                          const stats = floorStats[floor];
                                          let summaryParts = [];
                                          catDef.tasks.forEach((t) => {
                                            const key = t.key || t.name;
                                            const status =
                                              floorTaskStatus[floor][key];
                                            if (
                                              status.completed > 0 ||
                                              status.inProgress > 0
                                            ) {
                                              summaryParts.push(
                                                `${t.name}: แล้วเสร็จ ${status.completed}, กำลังดำเนินการ ${status.inProgress}`,
                                              );
                                            }
                                          });

                                          return `
                                                <div class="border-b border-slate-100 pb-3">
                                                    <div class="flex justify-between items-center mb-1">
                                                        <span class="font-black text-slate-800">ชั้น ${floor}</span>
                                                        <span class="text-indigo-600 font-black">${stats.progress}%</span>
                                                    </div>
                                                    <div class="flex justify-between items-center">
                                                        <p class="text-xs text-slate-500 font-medium">
                                                            ${summaryParts.length > 0 ? summaryParts.join(" | ") : "ยังไม่เริ่มดำเนินการ"}
                                                        </p>
                                                        <p class="text-[10px] text-slate-400 font-bold">คงเหลือ ${stats.total - stats.completed} ห้อง</p>
                                                    </div>
                                                </div>
                                            `;
                                        }).join("")}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right Column -->
                        <div class="w-full lg:w-[320px] flex flex-col gap-6 transition-all duration-300 ${showOverallProgressCard ? "" : "hidden"}">
                            <!-- Overall Progress Card -->
                            <div class="bg-white rounded-[2rem] p-8 text-slate-900 flex flex-col items-center justify-center relative overflow-hidden flex-1 min-h-[300px] border-2 border-black">
                                <h3 class="text-slate-400 font-black text-xs tracking-[0.2em] uppercase mb-10 z-10">OVERALL PROGRESS</h3>
                                
                                <!-- Circular Progress -->
                                <div class="relative w-48 h-48 flex items-center justify-center z-10">
                                    <svg class="w-full h-full transform -rotate-90">
                                        <circle cx="96" cy="96" r="80" stroke="currentColor" stroke-width="12" fill="transparent" class="text-slate-200" />
                                        <circle cx="96" cy="96" r="80" stroke="currentColor" stroke-width="12" fill="transparent" stroke-dasharray="502.6" stroke-dashoffset="${502.6 - (502.6 * overallProgress) / 100}" class="text-blue-600" stroke-linecap="round" />
                                    </svg>
                                    <div class="absolute inset-0 flex items-center justify-center">
                                        <span class="text-5xl font-black text-blue-600">${overallProgress}%</span>
                                    </div>
                                </div>
                                
                                <div class="mt-10 bg-slate-50 px-6 py-2 rounded-full border border-slate-200 z-10">
                                    <span class="text-xs font-black tracking-widest uppercase text-slate-500">DONE: ${totalCompletedRooms} / TOTAL: ${totalUnits}</span>
                                </div>
                            </div>
                            
                            <!-- Signature Boxes -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="bg-white border-2 border-dashed border-black rounded-2xl p-4 flex flex-col items-center justify-between min-h-[120px]">
                                    <span class="text-[10px] font-black text-black uppercase tracking-widest">PREPARED BY</span>
                                    <div class="w-full border-t border-black mt-8 mb-2"></div>
                                    <span class="text-[10px] font-bold text-slate-600">Site Engineer</span>
                                </div>
                                <div class="bg-white border-2 border-dashed border-black rounded-2xl p-4 flex flex-col items-center justify-between min-h-[120px]">
                                    <span class="text-[10px] font-black text-black uppercase tracking-widest">APPROVED BY</span>
                                    <div class="w-full border-t border-black mt-8 mb-2"></div>
                                    <span class="text-[10px] font-bold text-slate-600">Project Engineer</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
          if (window.lucide) lucide.createIcons();
        }

        function updateSplashAlerts() {
          const alertContainer = document.getElementById("splash-alert-banner");
          if (!alertContainer) return;

          if (
            !globalScheduleData ||
            globalScheduleData.length === 0 ||
            !globalScheduleTasks ||
            globalScheduleTasks.length === 0
          ) {
            alertContainer.classList.add("hidden");
            return;
          }

          let floorReports = [];
          let hasAnyAlert = false;

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const visibleTasks = globalScheduleTasks
            .map((task, index) => ({ task, index }))
            .filter(({ task, index }) => {
              if (
                task.category === "wetwork" &&
                !globalScheduleFilters.showWetWork
              )
                return false;
              if (
                task.category === "endproduct" &&
                !globalScheduleFilters.showEndProduct
              )
                return false;
              if (globalScheduleFilters.hiddenTasks.includes(index))
                return false;
              return true;
            });

          globalScheduleData
            .filter(
              (f) =>
                f.id >= globalScheduleFilters.minFloor &&
                f.id <= globalScheduleFilters.maxFloor,
            )
            .forEach((floor) => {
              let floorDelayed = [];
              let floorInProgress = [];
              let isAllDone = true;

              visibleTasks.forEach(({ task, index: taskIndex }) => {
                const actualStart = floor.actual[taskIndex * 2];
                const actualEnd = floor.actual[taskIndex * 2 + 1];
                const planStartStr = floor.plan[taskIndex * 2];
                const planEndStr = floor.plan[taskIndex * 2 + 1];

                const isDone = actualStart === "DONE" || actualEnd === "DONE";
                if (!isDone) isAllDone = false;

                if (!isDone && planEndStr) {
                  const planEndDate = new Date(planEndStr);
                  planEndDate.setHours(0, 0, 0, 0);

                  const taskNameRaw =
                    task.subName +
                    " " +
                    task.name.replace(/\s*\(\d+\s*วัน\)/, "");

                  if (planEndDate < today) {
                    const diffDays = Math.ceil(
                      (today - planEndDate) / (1000 * 60 * 60 * 24),
                    );
                    floorDelayed.push({ name: taskNameRaw, days: diffDays });
                  } else if (planStartStr) {
                    const planStartDate = new Date(planStartStr);
                    planStartDate.setHours(0, 0, 0, 0);
                    if (planStartDate <= today && planEndDate >= today) {
                      floorInProgress.push({
                        name: taskNameRaw,
                        endStr: formatThaiDateShort(planEndStr),
                      });
                    }
                  }
                }
              });

              if (floorDelayed.length > 0) {
                hasAnyAlert = true;
                const totalDays = floorDelayed.reduce(
                  (max, t) => Math.max(max, t.days),
                  0,
                );
                floorReports.push(`
                            <div class="flex items-start gap-5 p-5 rounded-xl border border-rose-100 bg-rose-50/10 shadow-[0_2px_10px_-3px_rgba(244,63,94,0.1)]">
                                <div class="flex-shrink-0 w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-2xl shadow-inner">
                                    ${floor.id}
                                </div>
                                <div class="flex-grow min-w-0">
                                    <div class="flex justify-between items-start mb-2 gap-2">
                                        <h4 class="font-black text-slate-800 text-xl">ชั้น ${floor.id}</h4>
                                        <span class="text-sm px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black shrink-0">ล่าช้ากว่าแผน</span>
                                    </div>
                                    <p class="text-base text-rose-700 font-bold mb-2">ล่าช้ารวม ${totalDays} วัน</p>
                                    <ul class="text-base text-slate-700 list-disc pl-5 space-y-2 font-medium">
                                        ${floorDelayed.map((t) => `<li class="break-words whitespace-normal">${t.name} <span class="text-rose-600 font-bold">(ช้า ${t.days} วัน)</span></li>`).join("")}
                                    </ul>
                                </div>
                            </div>
                        `);
              } else if (floorInProgress.length > 0 && !isAllDone) {
                hasAnyAlert = true;
                floorReports.push(`
                            <div class="flex items-start gap-5 p-5 rounded-xl border border-blue-100 bg-blue-50/10 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.1)]">
                                <div class="flex-shrink-0 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shadow-inner">
                                    ${floor.id}
                                </div>
                                <div class="flex-grow min-w-0">
                                    <div class="flex justify-between items-start mb-2 gap-2">
                                        <h4 class="font-black text-slate-800 text-xl">ชั้น ${floor.id}</h4>
                                        <span class="text-sm px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-black shrink-0">แผนงานที่ต้องทำวันนี้</span>
                                    </div>
                                    <ul class="text-base text-slate-700 list-disc pl-5 space-y-2 font-medium">
                                        ${floorInProgress.map((t) => `<li class="break-words whitespace-normal">${t.name} <span class="text-slate-500 font-semibold">(ครบกำหนด: ${t.endStr})</span></li>`).join("")}
                                    </ul>
                                </div>
                            </div>
                        `);
              }
            });

          // Format the date
          const thaiMonths = [
            "ม.ค.",
            "ก.พ.",
            "มี.ค.",
            "เม.ย.",
            "พ.ค.",
            "มิ.ย.",
            "ก.ค.",
            "ส.ค.",
            "ก.ย.",
            "ต.ค.",
            "พ.ย.",
            "ธ.ค.",
          ];
          const dateStr = `${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;

          if (!hasAnyAlert) {
            alertContainer.classList.add("hidden");
            return;
          }

          alertContainer.classList.remove("hidden");
          alertContainer.className =
            "mb-12 bg-white rounded-[2rem] shadow-xl border-2 border-slate-100 overflow-hidden";

          let html = `
                    <div class="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-8 py-5 flex justify-between items-center rounded-t-[2rem]">
                        <h3 class="font-black text-xl flex items-center gap-3 tracking-tight">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            สรุปงานที่ต้องติดตามประจำวันที่ ${dateStr}
                        </h3>
                    </div>
                    <div class="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        ${floorReports.join("")}
                    </div>
                `;

          alertContainer.innerHTML = html;
        }

        function calculateProjectSummary() {
          if (!projectData || Object.keys(projectData).length === 0) {
            return {
              overallProgress: 0,
              completedUnits: 0,
              qcPassRate: 0,
              taskProgress: {},
            };
          }

          let totalProgressPoints = 0;
          let totalMaxPoints = 0;
          let taskProgress = {};

          // 1. Calculate Residential Progress
          Object.keys(taskDefinitions).forEach((catKey) => {
            const catDef = taskDefinitions[catKey];
            let catTotalProgressPoints = 0;
            let catTotalMaxPoints = 0;

            CONFIG.FLOORS.forEach((floor) => {
              const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
              for (let room = 1; room <= roomsOnThisFloor; room++) {
                const unitData = projectData[catKey]?.[floor]?.[room] || {};
                if (catDef.type === "progress") {
                  // A simple progress from 0-100 for the entire task category
                  const applicableTasks = catDef.tasks.filter(
                    (t) => !t.condition || t.condition(floor, room),
                  );
                  const taskCount = applicableTasks.length;
                  const taskProg = (unitData.progress || 0) / taskCount;
                  const completedTasksProgress =
                    (unitData.taskIndex || 0) * (100 / taskCount);
                  catTotalProgressPoints += taskProg + completedTasksProgress;
                  catTotalMaxPoints += 100;
                } else if (catDef.type === "multi-progress") {
                  let subTaskTotal = 0;
                  let applicableTaskCount = 0;
                  catDef.tasks.forEach((task) => {
                    if (task.condition && !task.condition(floor, room)) return;
                    applicableTaskCount++;
                    subTaskTotal += unitData[`progress_${task.key}`] || 0;
                  });
                  catTotalProgressPoints +=
                    applicableTaskCount > 0
                      ? subTaskTotal / applicableTaskCount
                      : 0;
                  catTotalMaxPoints += 100;
                } else if (catDef.type === "inspection") {
                  const score =
                    unitData.qcScore > 0
                      ? unitData.qcScore
                      : unitData.cmScore || 0;
                  catTotalProgressPoints += score;
                  catTotalMaxPoints += 100;
                }
              }
            });

            totalProgressPoints += catTotalProgressPoints;
            totalMaxPoints += catTotalMaxPoints;

            taskProgress[catKey] =
              catTotalMaxPoints > 0
                ? (catTotalProgressPoints / catTotalMaxPoints) * 100
                : 0;
          });

          // 2. Calculate Common Area Progress
          let commonTotalProgressPoints = 0;
          let commonTotalMaxPoints = 0;
          Object.keys(commonAreaDefinitions).forEach((locKey) => {
            const locDef = commonAreaDefinitions[locKey];
            locDef.tasks.forEach((task, taskIndex) => {
              CONFIG.COMMON_AREA_FLOORS.forEach((floor) => {
                commonTotalProgressPoints +=
                  projectData.commonArea?.[locKey]?.tasks?.[taskIndex]
                    ?.progress?.[floor] || 0;
                commonTotalMaxPoints += 100;
              });
            });
          });

          totalProgressPoints += commonTotalProgressPoints;
          totalMaxPoints += commonTotalMaxPoints;

          taskProgress["common"] =
            commonTotalMaxPoints > 0
              ? (commonTotalProgressPoints / commonTotalMaxPoints) * 100
              : 0;

          const overallProgress =
            totalMaxPoints > 0
              ? (totalProgressPoints / totalMaxPoints) * 100
              : 0;

          // 3. Calculate Completed Units (based on End Product QC pass)
          let completedUnits = 0;
          if (projectData.endProduct) {
            CONFIG.FLOORS.forEach((floor) => {
              const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
              for (let room = 1; room <= roomsOnThisFloor; room++) {
                const unitData = projectData.endProduct[floor]?.[room] || {};
                if (unitData.qcScore >= 85) {
                  completedUnits++;
                }
              }
            });
          }

          // 4. Calculate QC Pass Rate
          let totalQcChecks = 0;
          let totalQcPasses = 0;
          ["wetWork", "endProduct"].forEach((catKey) => {
            if (!projectData[catKey]) return;
            CONFIG.FLOORS.forEach((floor) => {
              const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
              for (let room = 1; room <= roomsOnThisFloor; room++) {
                const unitData = projectData[catKey][floor]?.[room] || {};
                if (unitData.qcScore > 0) {
                  totalQcChecks++;
                  if (unitData.qcScore >= 85) {
                    totalQcPasses++;
                  }
                }
              }
            });
          });
          const qcPassRate =
            totalQcChecks > 0 ? (totalQcPasses / totalQcChecks) * 100 : 0;

          return { overallProgress, completedUnits, qcPassRate, taskProgress };
        }

        const categoryIcons = {
          skimAndPaint: {
            bg: "bg-transparent",
            color: "",
            svg: '<img src="https://img1.pic.in.th/images/paint.md.png" alt="งานสี" class="w-[70px] h-[70px] object-contain" />',
          },
          topping: {
            bg: "bg-transparent",
            color: "",
            svg: '<img src="https://img1.pic.in.th/images/Topping.png" alt="งาน Topping" class="w-[70px] h-[70px] object-contain" />',
          },
          electrical: {
            bg: "bg-yellow-100",
            color: "text-yellow-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
          },
          plumbing: {
            bg: "bg-blue-100",
            color: "text-blue-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
          },
          airCon: {
            bg: "bg-cyan-100",
            color: "text-cyan-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 8v4l3 3"/></svg>',
          },
          ceiling: {
            bg: "bg-sky-100",
            color: "text-sky-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/><path d="M4 6h16"/><path d="M4 18h16"/></svg>',
          },
          texcaWall: {
            bg: "bg-orange-100",
            color: "text-orange-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v6"/><path d="M15 9v6"/><path d="M9 15v6"/></svg>',
          },
          electricalRoughIn: {
            bg: "bg-yellow-100",
            color: "text-yellow-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
          },
          plumbingRoughIn: {
            bg: "bg-blue-100",
            color: "text-blue-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
          },
          airConRoughIn: {
            bg: "bg-cyan-100",
            color: "text-cyan-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 8v4l3 3"/></svg>',
          },
          waterproofing: {
            bg: "bg-cyan-100",
            color: "text-cyan-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>',
          },
          tiling: {
            bg: "bg-teal-100",
            color: "text-teal-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="8" x="3" y="3" rx="1"/><rect width="8" height="8" x="13" y="3" rx="1"/><rect width="8" height="8" x="3" y="13" rx="1"/><rect width="8" height="8" x="13" y="13" rx="1"/></svg>',
          },
          aluminum: {
            bg: "bg-slate-100",
            color: "text-slate-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>',
          },
          wetWork: {
            bg: "bg-indigo-100",
            color: "text-indigo-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
          },
          furniture: {
            bg: "bg-amber-100",
            color: "text-amber-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/><path d="M2 13v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5"/><path d="M6 13v-4"/><path d="M18 13v-4"/></svg>',
          },
          laminate: {
            bg: "bg-transparent",
            color: "",
            svg: '<img src="https://img1.pic.in.th/images/Untitled-5822b5d8fb838c5cc.png" alt="Laminate" class="w-[70px] h-[70px] object-contain" />',
          },
          door: {
            bg: "bg-transparent",
            color: "",
            svg: '<img src="https://img1.pic.in.th/images/Door.png" alt="งานประตู" class="w-[70px] h-[70px] object-contain" />',
          },
          showerScreen: {
            bg: "bg-transparent",
            color: "",
            svg: '<img src="https://img2.pic.in.th/shower-screen.png" alt="Shower Screen" class="w-[70px] h-[70px] object-contain" />',
          },
          endProduct: {
            bg: "bg-transparent",
            color: "",
            svg: '<img src="https://img1.pic.in.th/images/end.png" alt="End Product" class="w-[70px] h-[70px] object-contain" />',
          },
          aluminumPaint: {
            bg: "bg-transparent",
            color: "",
            svg: '<img src="https://img1.pic.in.th/images/alucolor.png" alt="Aluminum Paint" class="w-[70px] h-[70px] object-contain" />',
          },
          cleaning: {
            bg: "bg-transparent",
            color: "",
            svg: '<img src="https://img1.pic.in.th/images/clean10ebd589103179c6.png" alt="Cleaning" class="w-[70px] h-[70px] object-contain" />',
          },
          common: {
            bg: "bg-violet-100",
            color: "text-violet-600",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
          },
        };

        function renderSplashScreen() {
          const summary = calculateProjectSummary();
          const progressCircle = document.querySelector(
            ".infographic-progress-circle",
          );

          document.getElementById("splash-overall-progress").textContent =
            `${summary.overallProgress.toFixed(1)}%`;
          if (progressCircle)
            progressCircle.style.setProperty(
              "--progress",
              `${summary.overallProgress.toFixed(1)}%`,
            );

          document.getElementById("splash-qc-pass-rate").textContent =
            `${summary.qcPassRate.toFixed(1)}%`;

          updateSplashAlerts();

          // Render task cards
          const taskCardsContainer =
            document.getElementById("splash-task-cards");
          if (taskCardsContainer) {
            taskCardsContainer.innerHTML = "";

            const wetWorkKeys = [
              "skimAndPaint",
              "topping",
              "ceiling",
              "texcaWall",
              "waterproofing",
              "tiling",
              "aluminum",
              "wetWork",
            ];
            const endProductKeys = [
              "furniture",
              "laminate",
              "door",
              "showerScreen",
              "aluminumPaint",
              "cleaning",
              "endProduct",
            ];

            const createCard = (catKey, catDef, progress, isCommon = false) => {
              const iconData = categoryIcons[catKey] || {
                bg: "bg-slate-100",
                color: "text-slate-600",
                svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
              };
              const iconHtml = `<div class="w-14 h-14 rounded-2xl ${iconData.bg} ${iconData.color} flex items-center justify-center mb-4 shadow-sm">${iconData.svg}</div>`;

              const card = document.createElement("div");
              const hoverBorderColor = isCommon
                ? "hover:border-cyan-100"
                : "hover:border-indigo-100";
              const progressColor = isCommon ? "bg-cyan-500" : "bg-indigo-500";
              const textColor = isCommon ? "text-cyan-600" : "text-indigo-600";

              card.className = `splash-nav-card cursor-pointer p-5 flex flex-col items-center justify-center group bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md ${hoverBorderColor} transition-all`;
              card.onclick = () => {
                if (isCommon) {
                  enterAppView("common");
                } else {
                  currentCategory = catKey;
                  setupCategoryButtons();
                  enterAppView("residential");
                }
              };

              card.innerHTML = `
                            ${iconHtml}
                            <h3 class="text-sm font-semibold text-slate-800 text-center mb-4 line-clamp-2 h-10 flex items-center justify-center">${catDef.name}</h3>
                            <div class="w-full flex flex-col gap-1.5">
                                <div class="flex justify-between items-center text-xs">
                                    <span class="text-slate-500 font-medium">ความคืบหน้า</span>
                                    <span class="font-bold ${textColor}">${progress.toFixed(1)}%</span>
                                </div>
                                <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-200/50">
                                    <div class="${progressColor} h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" style="width: ${progress}%">
                                        <div class="absolute inset-0 bg-white/20 w-full" style="background-image: linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent); background-size: 1rem 1rem; animation: progress-stripes 1s linear infinite;"></div>
                                    </div>
                                </div>
                            </div>
                        `;
              return card;
            };

            const createGroupSection = (title, keys, colorClass) => {
              const section = document.createElement("div");

              const header = document.createElement("div");
              header.className = "flex items-center gap-3 mb-4";
              header.innerHTML = `
                            <div class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl ${colorClass}">${title}</div>
                            <div class="h-px flex-1 bg-slate-200"></div>
                        `;
              section.appendChild(header);

              const grid = document.createElement("div");
              grid.className =
                "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4";

              keys.forEach((key) => {
                if (taskDefinitions[key]) {
                  const progress = summary.taskProgress
                    ? summary.taskProgress[key] || 0
                    : 0;
                  grid.appendChild(
                    createCard(key, taskDefinitions[key], progress),
                  );
                }
              });

              section.appendChild(grid);
              return section;
            };

            // Add WETWORK Group
            taskCardsContainer.appendChild(
              createGroupSection(
                "WETWORK",
                wetWorkKeys,
                "bg-blue-100 text-blue-700",
              ),
            );

            // Add END PRODUCT Group
            taskCardsContainer.appendChild(
              createGroupSection(
                "END PRODUCT",
                endProductKeys,
                "bg-emerald-100 text-emerald-700",
              ),
            );

            // Add Common Area Section
            const commonSection = document.createElement("div");
            const commonHeader = document.createElement("div");
            commonHeader.className = "flex items-center gap-3 mb-4";
            commonHeader.innerHTML = `
                        <div class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-violet-100 text-violet-700">ส่วนกลาง</div>
                        <div class="h-px flex-1 bg-slate-200"></div>
                    `;
            commonSection.appendChild(commonHeader);

            const commonGrid = document.createElement("div");
            commonGrid.className =
              "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4";

            const commonProgress = summary.taskProgress
              ? summary.taskProgress["common"] || 0
              : 0;
            commonGrid.appendChild(
              createCard(
                "common",
                { name: "พื้นที่ส่วนกลาง" },
                commonProgress,
                true,
              ),
            );

            commonSection.appendChild(commonGrid);
            taskCardsContainer.appendChild(commonSection);
          }
        }

        window.enterAppView = enterAppView;
        function enterAppView(view) {
          document.getElementById("splash-screen").classList.add("hidden");
          document
            .getElementById("main-app-container")
            .classList.remove("hidden");
          document
            .getElementById("quick-update-mode-container")
            .classList.add("hidden");
          currentView = view;

          const resBtn = document.getElementById("view-residential-btn");
          const comBtn = document.getElementById("view-common-btn");
          const qcBtn = document.getElementById("view-qc-summary-btn");
          const reportBtn = document.getElementById("view-summary-report-btn");
          const scheduleBtn = document.getElementById("view-schedule-btn");
          const qcHandoverBtn = document.getElementById("view-qc-handover-btn");

          resBtn.classList.toggle("active", view === "residential");
          comBtn.classList.toggle("active", view === "common");
          qcBtn.classList.toggle("active", view === "qcSummary");
          reportBtn.classList.toggle("active", view === "summaryReport");
          if (scheduleBtn)
            scheduleBtn.classList.toggle("active", view === "schedule");
          if (qcHandoverBtn)
            qcHandoverBtn.classList.toggle("active", view === "qcHandover");

          // Hide summary tables if not in qcHandover view
          const qcSummaryContainer = document.getElementById(
            "qc-handover-summary-container",
          );
          if (qcSummaryContainer) {
            qcSummaryContainer.classList.toggle(
              "hidden",
              view !== "qcHandover",
            );
          }

          // Show/Hide summary report mode toggle
          const reportModeToggle = document.getElementById(
            "summary-report-mode-toggle",
          );
          const headerStyleToggle = document.getElementById(
            "report-header-style-toggle",
          );
          const taskViewModeToggle = document.getElementById(
            "task-view-mode-toggle",
          );

          const settingsContainer =
            document.getElementById("schedule-settings");
          if (settingsContainer) {
            // Always hide when switching views, user must click to open
            settingsContainer.classList.add("hidden");
          }

          if (taskViewModeToggle) {
            const categoryDef = taskDefinitions[currentCategory];
            const isMultiProgress =
              categoryDef && categoryDef.type === "multi-progress";
            const shouldShow = view === "residential" && isMultiProgress;
            taskViewModeToggle.classList.toggle("hidden", !shouldShow);
            if (shouldShow) {
              document
                .getElementById("task-view-summary-btn")
                .classList.toggle("active", !isDetailedViewActive);
              document
                .getElementById("task-view-detailed-btn")
                .classList.toggle("active", isDetailedViewActive);
            }
          }

          if (reportModeToggle) {
            reportModeToggle.classList.toggle(
              "hidden",
              view !== "summaryReport",
            );
            if (view === "summaryReport") {
              document
                .getElementById("summary-report-wet-btn")
                .classList.toggle("active", summaryReportMode === "wetWork");
              document
                .getElementById("summary-report-end-btn")
                .classList.toggle("active", summaryReportMode === "endProduct");
            }
          }

          if (headerStyleToggle) {
            const isResidentialOrSummary =
              view === "residential" ||
              view === "summaryReport" ||
              view === "schedule" ||
              view === "qcHandover" ||
              view === "qcSummary";
            headerStyleToggle.classList.toggle(
              "hidden",
              !isResidentialOrSummary,
            );
            if (isResidentialOrSummary) {
              document
                .getElementById("header-style-dark-btn")
                .classList.toggle("active", reportHeaderStyle === "dark");
              document
                .getElementById("header-style-light-btn")
                .classList.toggle("active", reportHeaderStyle === "light");
            }
          }

          const floorSelection = document.getElementById(
            "summary-report-floor-selection",
          );
          if (floorSelection) {
            floorSelection.classList.toggle("hidden", view !== "summaryReport");
            if (view === "summaryReport") {
              renderSummaryReportFloorList();
            }
          }

          const toggleSummaryBtn = document.getElementById(
            "toggleExecutiveSummaryBtn",
          );
          const toggleOverallBtn = document.getElementById(
            "overall-progress-toggle-btn",
          );
          const isResidentialOrSummary =
            view === "residential" ||
            view === "summaryReport" ||
            view === "schedule";

          if (toggleSummaryBtn) {
            toggleSummaryBtn.classList.toggle(
              "hidden",
              !isResidentialOrSummary,
            );
          }
          if (toggleOverallBtn) {
            toggleOverallBtn.classList.toggle(
              "hidden",
              !isResidentialOrSummary || !showExecutiveSummary,
            );
          }

          const floatingBar = document.getElementById(
            "schedule-quick-filter-floating",
          );
          if (floatingBar) {
            floatingBar.classList.toggle("hidden", view !== "schedule");
          }

          renderTable();
        }

        function enterQuickUpdateMode() {
          const quickUpdateContainer = document.getElementById(
            "quick-update-mode-container",
          );
          document.getElementById("splash-screen").classList.add("hidden");
          document.getElementById("main-app-container").classList.add("hidden");
          quickUpdateContainer.classList.remove("hidden");
          quickUpdateContainer.classList.add("ios-style");
          document
            .getElementById("quick-update-task-list")
            .classList.add("ios-style");
          setupQuickUpdateSelectors();
          renderQuickUpdateTaskList();
        }

        window.backToSplash = backToSplash;
        function backToSplash() {
          document.getElementById("main-app-container").classList.add("hidden");
          document
            .getElementById("quick-update-mode-container")
            .classList.add("hidden");
          document.getElementById("splash-screen").classList.remove("hidden");

          const floatingBar = document.getElementById(
            "schedule-quick-filter-floating",
          );
          if (floatingBar) {
            floatingBar.classList.add("hidden");
          }

          renderSplashScreen(); // Re-render in case of updates
        }

        function getProgressColor(progress, baseColor = "bg-sky-500") {
          if (progress === undefined || progress === 0)
            return "bg-white text-black";
          const colorName = baseColor.split("-")[1] || "sky";
          const colorShade = parseInt(baseColor.split("-")[2] || "500", 10);

          if (progress >= 100) return "bg-teal-500 text-white";
          if (progress > 60) return `${baseColor}`;
          if (progress > 30)
            return `bg-${colorName}-${Math.max(200, colorShade - 100)} text-black`;
          return `bg-${colorName}-200 text-black`;
        }

        function getHeaderColors() {
          return {
            headerColor:
              reportHeaderStyle === "light"
                ? "bg-slate-200 text-slate-900 border-b border-slate-400"
                : "bg-[#1e3a8a] text-white",
            subHeaderColor:
              reportHeaderStyle === "light"
                ? "bg-slate-50 text-slate-600"
                : "bg-slate-800 text-white",
            stickyHeaderColor:
              reportHeaderStyle === "light" ? "bg-slate-200" : "bg-[#1e3a8a]",
          };
        }

        function renderTable() {
          const captureArea = document.getElementById("capture-area");
          const mainTable = document.getElementById("main-table");

          renderExecutiveSummaryDashboard();

          // Clean up any custom report elements
          if (mainTable._reportElements) {
            mainTable._reportElements.forEach((el) => el.remove());
            mainTable._reportElements = null;
          }
          mainTable.classList.remove("hidden");

          // Reset table border classes (Schedule view might have changed them)
          mainTable.classList.remove("border-separate", "border-spacing-0");
          mainTable.classList.add("border-collapse");

          const floorSelection = document.getElementById(
            "summary-report-floor-selection",
          );
          if (floorSelection) {
            floorSelection.classList.toggle(
              "hidden",
              currentView !== "summaryReport",
            );
          }

          if (Object.keys(projectData).length === 0) {
            document.getElementById("main-table").innerHTML =
              '<tr><td class="p-4">กำลังโหลดข้อมูลจากฐานข้อมูล...</td></tr>';
            return;
          }

          if (currentView === "residential") {
            captureArea.classList.remove("common-view-active");
            renderResidentialTable();
          } else if (currentView === "common") {
            captureArea.classList.add("common-view-active");
            renderCommonAreaTable();
          } else if (currentView === "qcSummary") {
            captureArea.classList.remove("common-view-active");
            renderQCSummaryTable();
          } else if (currentView === "summaryReport") {
            captureArea.classList.remove("common-view-active");
            renderSummaryReportTable();
          } else if (currentView === "schedule") {
            captureArea.classList.remove("common-view-active");
            renderScheduleTable();
          } else if (currentView === "qcHandover") {
            captureArea.classList.remove("common-view-active");
            renderQCHandoverTable();
          }
          updateUI();
        }

        function renderSummaryReportTable() {
          const mainTable = document.getElementById("main-table");
          mainTable.innerHTML = "";

          if (!projectData.plans) projectData.plans = {};

          const wetWorkTasks = [
            "texcaWallOnly",
            "electricalRoughIn",
            "plumbingRoughIn",
            "airConRoughIn",
            "topping",
            "waterproofing",
            "tiling",
            "ceilingRoomFraming",
            "ceilingBathroomFraming",
            "ceilingBoard",
            "above_ceiling_inspection",
            "skimAndPaintCombined",
            "wetWork",
          ];
          const endProductTasks = [
            "electrical",
            "plumbing",
            "airCon",
            "door",
            "aluminum",
            "laminate",
            "showerScreenInspection",
            "showerScreen",
            "kitchenOnly",
            "paintOnly",
            "aluminumPaint",
            "cleaning",
            "endProduct",
          ];

          const activeTaskKeys =
            summaryReportMode === "wetWork" ? wetWorkTasks : endProductTasks;
          const activeTasks = activeTaskKeys
            .map((key) => {
              if (key === "texcaWallOnly") {
                return {
                  key: "texcaWallOnly",
                  name: "งานผนัง TEXCA",
                  reportName: "TEXCA",
                  reportEmoji: "🧱",
                  type: "progress-texca",
                };
              }
              if (key === "ceilingRoomFraming") {
                return {
                  key: "ceilingRoomFraming",
                  name: "โครงฝ้าห้องพัก",
                  reportName: "โครงฝ้า(พัก)",
                  reportEmoji: "🪜",
                  type: "progress-ceiling-room-framing",
                };
              }
              if (key === "ceilingBathroomFraming") {
                return {
                  key: "ceilingBathroomFraming",
                  name: "โครงฝ้าห้องน้ำ",
                  reportName: "โครงฝ้า(น้ำ)",
                  reportEmoji: "🪜",
                  type: "progress-ceiling-bathroom-framing",
                };
              }
              if (key === "ceilingBoard") {
                return {
                  key: "ceilingBoard",
                  name: "ปิดแผ่นฝ้า",
                  reportName: "ปิดแผ่น",
                  reportEmoji: "🪜",
                  type: "progress-ceiling-board",
                };
              }
              if (key === "above_ceiling_inspection") {
                return {
                  key: "above_ceiling_inspection",
                  name: "ตรวจเหนือฝ้า",
                  reportName: "ตรวจเหนือฝ้า",
                  reportEmoji: "🪜",
                  type: "progress-above-ceiling-inspection",
                };
              }
              if (key === "skimAndPaintCombined") {
                return {
                  key: "skimAndPaintCombined",
                  name: "งานสกิมทาสี",
                  reportName: "สกิมทาสี",
                  reportEmoji: "🖌️",
                  type: "progress-skim-paint",
                };
              }
              if (key === "kitchenOnly") {
                return {
                  key: "kitchenOnly",
                  name: "งานติดตั้งชุดครัว",
                  reportName: "ชุดครัว",
                  reportEmoji: "🍳",
                  type: "progress-kitchen",
                };
              }
              if (key === "paintOnly") {
                return {
                  key: "paintOnly",
                  name: "งานสี",
                  reportName: "งานสี",
                  reportEmoji: "🎨",
                  type: "progress-paint",
                };
              }
              if (key === "skimOnly") {
                return {
                  key: "skimOnly",
                  name: "งานสกิม",
                  reportName: "งานสกิม",
                  reportEmoji: "🖌️",
                  type: "progress-skim",
                };
              }
              if (key === "showerScreenInspection") {
                return {
                  key: "showerScreenInspection",
                  name: "ตรวจรับพื้นที่ SHOWER SCREEN",
                  reportName: "ตรวจรับพื้นที่ (Shower)",
                  reportEmoji: "🔍",
                  type: "progress-inspection",
                };
              }
              return { key, ...taskDefinitions[key] };
            })
            .filter((t) => t.reportName);

          const thead = document.createElement("thead");
          const { headerColor, stickyHeaderColor } = getHeaderColors();

          const headerHTML = `
                    <tr class="${headerColor}">
                        <th class="border border-slate-400 p-2 sticky left-0 z-30 ${stickyHeaderColor} shadow-[2px_0_5px_rgba(0,0,0,0.1)]" style="min-width: 60px; font-size: 13px;">ห้อง</th>
                        ${activeTasks
                          .map((t) => {
                            return `
                                <th class="border border-slate-400 p-2" style="min-width: 90px;">
                                    <div class="flex flex-col items-center justify-center gap-1">
                                        <span class="font-bold" style="font-size: 12px;">${t.reportName}</span>
                                    </div>
                                </th>`;
                          })
                          .join("")}
                    </tr>`;
          thead.innerHTML = headerHTML;
          mainTable.appendChild(thead);

          const tbody = document.createElement("tbody");
          CONFIG.FLOORS.filter((f) =>
            summaryReportSelectedFloors.includes(f),
          ).forEach((floor) => {
            const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
            for (let room = 1; room <= roomsOnThisFloor; room++) {
              const row = document.createElement("tr");
              row.className = "hover:bg-slate-50 transition-colors";

              let rowHTML = `
                            <td class="border border-slate-400 p-2 font-bold text-center sticky left-0 z-20 bg-white">${floor * 100 + room}</td>
                        `;

              activeTasks.forEach((taskDef) => {
                let taskData;
                let progress = 0;
                let scoreToShow = null;

                if (taskDef.key === "texcaWallOnly") {
                  taskData = projectData["texcaWall"]?.[floor]?.[room] || {};
                  if (taskData.taskIndex === 2) {
                    progress = taskData.progress || 0;
                  } else if (taskData.taskIndex > 2) {
                    progress = 100;
                  } else {
                    progress = 0;
                  }
                } else if (taskDef.key === "ceilingRoomFraming") {
                  taskData = projectData["ceiling"]?.[floor]?.[room] || {};
                  progress = taskData["progress_room_framing"] || 0;
                } else if (taskDef.key === "ceilingBathroomFraming") {
                  taskData = projectData["ceiling"]?.[floor]?.[room] || {};
                  progress = taskData["progress_bathroom_framing"] || 0;
                } else if (taskDef.key === "ceilingBoard") {
                  taskData = projectData["ceiling"]?.[floor]?.[room] || {};
                  const roomBoard = taskData["progress_room_board"] || 0;
                  const bathBoard = taskData["progress_bathroom_board"] || 0;
                  // If either was submitted or they just want the average of both, let's average. 
                  // If both boards are done, it'll average to 100.
                  progress = (roomBoard + bathBoard) / 2;
                } else if (taskDef.key === "above_ceiling_inspection") {
                  taskData = projectData["ceiling"]?.[floor]?.[room] || {};
                  progress = taskData["progress_above_ceiling_inspection"] || 0;
                } else if (taskDef.key === "skimAndPaintCombined") {
                  taskData = projectData["skimAndPaint"]?.[floor]?.[room] || {};
                  if (taskData.taskIndex === 1) {
                    progress = 50 + ((taskData.progress || 0) / 2);
                  } else {
                    progress = (taskData.progress || 0) / 2;
                  }
                } else if (taskDef.key === "paintOnly") {
                  taskData = projectData["skimAndPaint"]?.[floor]?.[room] || {};
                  if (taskData.taskIndex === 1) {
                    progress = taskData.progress || 0;
                  } else {
                    progress = 0;
                  }
                } else if (taskDef.key === "skimOnly") {
                  taskData = projectData["skimAndPaint"]?.[floor]?.[room] || {};
                  if (taskData.taskIndex === 0) {
                    progress = taskData.progress || 0;
                  } else if (taskData.taskIndex > 0) {
                    progress = 100;
                  } else {
                    progress = 0;
                  }
                } else if (taskDef.key === "kitchenOnly") {
                  taskData = projectData["furniture"]?.[floor]?.[room] || {};
                  if (taskData.taskIndex === 0) {
                    progress = taskData.progress || 0;
                  } else if (taskData.taskIndex > 0) {
                    progress = 100;
                  } else {
                    progress = 0;
                  }
                } else if (taskDef.key === "showerScreenInspection") {
                  taskData = projectData["showerScreen"]?.[floor]?.[room] || {};
                  if (taskData.taskIndex === 0) {
                    progress = taskData.progress || 0;
                  } else if (taskData.taskIndex > 0) {
                    progress = 100;
                  } else {
                    progress = 0;
                  }
                } else if (taskDef.key === "showerScreen") {
                  taskData = projectData["showerScreen"]?.[floor]?.[room] || {};
                  if (taskData.taskIndex === 1) {
                    progress = taskData.progress || 0;
                  } else if (taskData.taskIndex > 1) {
                    progress = 100;
                  } else {
                    progress = 0;
                  }
                } else {
                  taskData = projectData[taskDef.key]?.[floor]?.[room] || {};
                  if (taskDef.type === "progress") {
                    progress = taskData.progress || 0;
                  } else if (taskDef.type === "multi-progress") {
                    // Average of sub-tasks
                    const applicableSubTasks = (taskDef.tasks || []).filter(
                      (t) => !t.condition || t.condition(floor, room),
                    );
                    const totalProgress = applicableSubTasks.reduce(
                      (sum, st) => sum + (taskData[`progress_${st.key}`] || 0),
                      0,
                    );
                    progress =
                      applicableSubTasks.length > 0
                        ? totalProgress / applicableSubTasks.length
                        : 0;
                  } else if (taskDef.type === "inspection") {
                    const score =
                      taskData.qcScore > 0
                        ? taskData.qcScore
                        : taskData.cmScore || 0;
                    scoreToShow = score;
                    progress = score >= 85 ? 100 : 0;
                  }
                }

                const isComplete = Math.round(progress) >= 100;
                let planData =
                  projectData.plans?.[floor]?.[room]?.[taskDef.key] || {};
                if (typeof planData === "string") {
                  // Migrate old string data
                  planData = {
                    currentPlanDate: planData,
                    firstPlanDate: planData,
                    history: [{ date: planData, timestamp: Date.now() }],
                  };
                }

                const hasPlan =
                  !!planData.currentPlanDate ||
                  !!planData.firstPlanDate ||
                  (planData.history && planData.history.length > 0) ||
                  !!planData.note;
                const hasProgress = progress > 0;

                function formatShortThaiDate(dateStr) {
                  if (!dateStr) return "";
                  const date = new Date(dateStr);
                  if (isNaN(date.getTime())) return dateStr;
                  const thaiMonths = [
                    "ม.ค.",
                    "ก.พ.",
                    "มี.ค.",
                    "เม.ย.",
                    "พ.ค.",
                    "มิ.ย.",
                    "ก.ค.",
                    "ส.ค.",
                    "ก.ย.",
                    "ต.ค.",
                    "พ.ย.",
                    "ธ.ค.",
                  ];
                  const d = date.getDate();
                  const m = thaiMonths[date.getMonth()];
                  const y = (date.getFullYear() + 543).toString().slice(-2);
                  return `${d} ${m}${y}`;
                }

                const noteIcon = planData.note
                  ? `<div class="absolute top-0.5 right-0.5 text-amber-500" title="${planData.note.replace(/"/g, "&quot;")}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>`
                  : "";
                const noteDisplay = planData.note
                  ? `<div class="text-[11px] leading-tight text-amber-600 mt-0.5 truncate w-full max-w-[80px] mx-auto" title="${planData.note.replace(/"/g, "&quot;")}">${planData.note}</div>`
                  : "";

                if (taskDef.type === "inspection" && scoreToShow > 0) {
                  let completedDateDisplay = "";
                  if (planData.currentPlanDate) {
                    completedDateDisplay = `<span class="text-sm font-bold text-slate-700 mt-0.5">${formatShortThaiDate(planData.currentPlanDate)}</span>`;
                  }
                  const bgClass =
                    scoreToShow >= 85
                      ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100";
                  rowHTML += `
                                    <td class="border border-slate-400 p-1 text-center ${bgClass} cursor-pointer transition-colors table-cell relative" data-floor="${floor}" data-room="${room}" data-taskkey="${taskDef.key}">
                                        ${noteIcon}
                                        <div class="flex flex-col items-center justify-center gap-0.5 pointer-events-none w-full overflow-hidden">
                                            <div class="font-bold text-lg">${Number.isInteger(scoreToShow) ? scoreToShow : scoreToShow.toFixed(2)}</div>
                                            ${completedDateDisplay}
                                            ${noteDisplay}
                                        </div>
                                    </td>`;
                } else if (isComplete) {
                  let completedDateDisplay = "";
                  if (planData.currentPlanDate) {
                    completedDateDisplay = `<span class="text-sm font-bold text-emerald-700 mt-0.5">${formatShortThaiDate(planData.currentPlanDate)}</span>`;
                  }
                  rowHTML += `
                                    <td class="border border-slate-400 p-1 text-center bg-emerald-50 text-emerald-600 cursor-pointer hover:bg-emerald-100 transition-colors table-cell relative" data-floor="${floor}" data-room="${room}" data-taskkey="${taskDef.key}">
                                        ${noteIcon}
                                        <div class="flex flex-col items-center justify-center gap-0.5 pointer-events-none w-full overflow-hidden">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                                            ${completedDateDisplay}
                                            ${noteDisplay}
                                        </div>
                                    </td>`;
                } else if (!hasPlan && !hasProgress) {
                  rowHTML += `
                                    <td class="border border-slate-400 p-2 text-center bg-white cursor-pointer hover:bg-slate-50 transition-colors text-slate-400 table-cell relative" data-floor="${floor}" data-room="${room}" data-taskkey="${taskDef.key}">
                                        ${noteIcon}
                                        <div class="flex flex-col items-center justify-center gap-0.5 pointer-events-none w-full overflow-hidden">
                                            <span>-</span>
                                            ${noteDisplay}
                                        </div>
                                    </td>`;
                } else {
                  let planDisplay = "";
                  let isOverdue = false;
                  if (planData.currentPlanDate) {
                    const planDate = new Date(planData.currentPlanDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (planDate < today) {
                      isOverdue = true;
                    }

                    planDisplay = `<span class="${isOverdue ? "text-rose-700" : "text-slate-800"} font-bold text-sm">${formatShortThaiDate(planData.currentPlanDate)}</span>`;
                    if (
                      planData.firstPlanDate &&
                      planData.currentPlanDate > planData.firstPlanDate
                    ) {
                      const date1 = new Date(planData.firstPlanDate);
                      const date2 = new Date(planData.currentPlanDate);
                      const diffTime = Math.abs(date2 - date1);
                      const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24),
                      );
                      if (diffDays > 0) {
                        planDisplay += `<div class="text-[9px] text-rose-600 font-bold mt-0.5">(ช้ากว่าแผนเดิม ${diffDays} วัน)</div>`;
                      }
                    }
                  }

                  const bgClass = isOverdue
                    ? "bg-rose-50 shadow-[inset_0_0_15px_rgba(225,29,72,0.15)] hover:bg-rose-100"
                    : "bg-white hover:bg-slate-50";

                  rowHTML += `
                                    <td class="border border-slate-400 p-1 text-center ${bgClass} cursor-pointer transition-colors table-cell relative" data-floor="${floor}" data-room="${room}" data-taskkey="${taskDef.key}">
                                        ${noteIcon}
                                        <div class="flex flex-col gap-1.5 h-full justify-center pointer-events-none w-full overflow-hidden">
                                            ${
                                              hasProgress
                                                ? `
                                            <div class="${planData.currentPlanDate ? "text-xs" : "text-sm"} font-bold text-blue-600">
                                                ${Math.round(progress)}%
                                            </div>
                                            `
                                                : ""
                                            }
                                            ${
                                              planDisplay
                                                ? `
                                            <div class="leading-tight mt-0.5">
                                                ${planDisplay}
                                            </div>`
                                                : ""
                                            }
                                            ${noteDisplay}
                                        </div>
                                    </td>`;
                }
              });
              row.innerHTML = rowHTML;
              tbody.appendChild(row);
            }
          });
          mainTable.appendChild(tbody);
        }

        function renderSummaryReportFloorList() {
          const container = document.getElementById(
            "summary-report-floor-list",
          );
          if (!container) return;
          container.innerHTML = "";

          // Add multi-select toggle button
          const multiSelectBtn = document.createElement("button");
          multiSelectBtn.className = `px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${isMultiFloorSelectionEnabled ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`;
          multiSelectBtn.innerHTML = `<i data-lucide="layers" class="w-3.5 h-3.5"></i> เลือกหลายชั้น`;
          multiSelectBtn.onclick = () => {
            isMultiFloorSelectionEnabled = !isMultiFloorSelectionEnabled;
            if (
              !isMultiFloorSelectionEnabled &&
              summaryReportSelectedFloors.length > 1
            ) {
              // If turning off multi-select and multiple floors are selected, keep only the first one
              summaryReportSelectedFloors = [summaryReportSelectedFloors[0]];
              renderSummaryReportTable();
            }
            renderSummaryReportFloorList();
          };
          container.appendChild(multiSelectBtn);

          // Add a divider
          const divider = document.createElement("div");
          divider.className = "w-px h-6 bg-slate-200 mx-1 self-center";
          container.appendChild(divider);

          CONFIG.FLOORS.forEach((floor) => {
            const isSelected = summaryReportSelectedFloors.includes(floor);
            const btn = document.createElement("button");
            btn.className = `px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${isSelected ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"}`;
            btn.textContent = `ชั้น ${floor}`;
            btn.onclick = () => {
              if (isMultiFloorSelectionEnabled) {
                if (summaryReportSelectedFloors.includes(floor)) {
                  if (summaryReportSelectedFloors.length > 1) {
                    summaryReportSelectedFloors =
                      summaryReportSelectedFloors.filter((f) => f !== floor);
                  }
                } else {
                  summaryReportSelectedFloors.push(floor);
                  summaryReportSelectedFloors.sort((a, b) => b - a);
                }
              } else {
                summaryReportSelectedFloors = [floor];
              }
              renderSummaryReportFloorList();
              renderSummaryReportTable();
            };
            container.appendChild(btn);
          });

          if (window.lucide) {
            lucide.createIcons();
          }
        }

        let globalScheduleTasks = [
          // Wet Work
          {
            name: "ตีไลน์ (3วัน)",
            subName: "U1",
            color: "bg-[#e2efda]",
            duration: 3,
            category: "wetwork",
          },
          {
            name: "ตั้งเสาเอ็น/เขิบห้องน้ำ+ทางเดิน+ระเบียง (7วัน)",
            subName: "U2",
            color: "bg-[#e2efda]",
            duration: 7,
            category: "wetwork",
          },
          {
            name: "งานระบบตีเส้น SPK,M&E ตรวจสอบตำแหน่งท่อฝังพื้น ,เดินระบบ SPK+SLEEVE ท่อผ่านผนัง+ท่อในชาร์ป (SN ,ท่อแอร์ /ท่อลม/ติดดวงโคม) (10วัน)",
            subName: "U3-U5",
            color: "bg-[#d9d2e9]",
            duration: 10,
            category: "wetwork",
          },
          {
            name: "ยิงซิลิโคน PC/ เก๊าท์ผนัง PC (7วัน)",
            subName: "U6",
            color: "bg-[#e2efda]",
            duration: 7,
            category: "wetwork",
          },
          {
            name: "ติดตั้งแผ่นTexca wall , เก็บอุดรอยต่อแผ่น Texca wall (10วัน)",
            subName: "U7-U8",
            color: "bg-[#e2efda]",
            duration: 10,
            category: "wetwork",
          },
          {
            name: "M&E WORK (เดินท่อในผนัง) ติดตั้งเอ้าท์เลท /เบิ้ลผนัง/เทสปั๊มน้ำ , Test Pressure ท่อน้ำ+SPK (10วัน) ,ร้อยสายไฟ/ พ่นดวงโคม/พัดลม",
            subName: "U9-U11",
            color: "bg-[#d9d2e9]",
            duration: 10,
            category: "wetwork",
          },
          {
            name: "เทเสาเอ็น/เก๊าท์ท่อฝังผนังครัว /เก๊าท์ ท่อแอร์ , งานฉาบเสาโครงสร้าง / ฉาบผนังรอยต่อ (7วัน)",
            subName: "U12-U13",
            color: "bg-[#a9d08e]",
            duration: 7,
            category: "wetwork",
          },
          {
            name: "งานเทท็อปปิ้งพื้นห้องพัก /ห้องน้ำ/ระเบียง , งานติดตั้งราวกันตก ระเบียง(7วัน)",
            subName: "U14-U15",
            color: "bg-[#a9d08e]",
            duration: 7,
            category: "wetwork",
          },
          {
            name: "งานกันซึมห้องน้ำ / ระเบียง , งานปูกระเบื้อง (พื้นห้องน้ำ,ผนังห้องน้ำ,ระเบียง,ผนังครัว,พื้นครัว) (14วัน)",
            subName: "U16-U17",
            color: "bg-[#a9d08e]",
            duration: 14,
            category: "wetwork",
          },
          {
            name: "งานติดตั้งโครงฝ้า , ปิดแผ่นฝ้า ,ฉาบฝ้าห้องพักห้องน้ำ (10วัน)",
            subName: "U18,U20-U21",
            color: "bg-[#a9d08e]",
            duration: 10,
            category: "wetwork",
          },
          {
            name: "งานเทสไฟ/เซอร์กิต เหนือฝ้า(7วัน)",
            subName: "U19",
            color: "bg-[#d9d2e9]",
            duration: 7,
            category: "wetwork",
          },
          {
            name: "งานสกิมผนัง,งานขัด+ทาสีรองพื้น 1 รอบ ,เจาะฝ้าดาวน์ไลท์ (10วัน)",
            subName: "U22-U23",
            color: "bg-[#a9d08e]",
            duration: 10,
            category: "wetwork",
          },
          {
            name: "ส่ง CM ตรวจ Wet Work ส่ง QC ตรวจ Wet Work(10 วัน)",
            subName: "U24-U26",
            color: "bg-[#f4b084]",
            duration: 10,
            category: "wetwork",
          },
          // End Product
          {
            name: "เก็บดีเฟค QC WW 1(สีจริงเที่ยวแรก) (7 วัน)",
            subName: "U27",
            color: "bg-[#cfe2f3]",
            duration: 7,
            category: "endproduct",
          },
          {
            name: "งานอะลูมิเนียมติดตั้งกรอบเฟรมบานเลื่อน-อุปกรณ์ แล้วเสร็จ 100% ติดตั้งกระจกระเบียง(7 วัน)",
            subName: "U28",
            color: "bg-[#cfe2f3]",
            duration: 7,
            category: "endproduct",
          },
          {
            name: "งานติดตั้งประตูห้องพัก /ห้องน้ำ/ห้องนอน /ประตูชาร์ป แล้วเสร็จ 100%(7วัน)",
            subName: "U29",
            color: "bg-[#cfe2f3]",
            duration: 7,
            category: "endproduct",
          },
          {
            name: "ติดตั้งอุปกรณ์ดวงโคม+Consumer+Gill+Air(พร้อมTest) (7วัน)",
            subName: "U30",
            color: "bg-[#ead1dc]",
            duration: 7,
            category: "endproduct",
          },
          {
            name: "ติดตั้งสุขภัณฑ์ + อุปกรณ์ในห้องน้ำ (7 วัน)",
            subName: "U31",
            color: "bg-[#ead1dc]",
            duration: 7,
            category: "endproduct",
          },
          {
            name: "ติดตั้ง Shower Screen (7วัน)",
            subName: "U32",
            color: "bg-[#cfe2f3]",
            duration: 7,
            category: "endproduct",
          },
          {
            name: "งานเฟอร์นิเจอร์ (SB) 1.ติดตั้งชุดครัว 2.เคาน์เตอร์ห้องน้ำ 3.ติดตั้งกระจกเงา แล้วเสร็จ 100% (7วัน)",
            subName: "U33",
            color: "bg-[#cfe2f3]",
            duration: 7,
            category: "endproduct",
          },
          {
            name: "ปูพื้นไม้ลามิเนต (7วัน)",
            subName: "U34",
            color: "bg-[#cfe2f3]",
            duration: 7,
            category: "endproduct",
          },
          {
            name: "งานสีเที่ยวสุดท้าย แล้วเสร็จ 100%(10วัน)+ติดตั้งปลั๊ก+หน้ากากปลั๊ก",
            subName: "U35-U36",
            color: "bg-[#cfe2f3]",
            duration: 10,
            category: "endproduct",
          },
          {
            name: "ส่ง Cm Endproduct เก็บงาน CM End-Product(7วัน)",
            subName: "U37",
            color: "bg-[#cfe2f3]",
            duration: 7,
            category: "endproduct",
          },
          {
            name: "ส่ง QC End Product(14 วัน)",
            subName: "U38",
            color: "bg-[#cfe2f3]",
            duration: 14,
            category: "endproduct",
          },
        ];

        let globalScheduleSettings = {
          workOnSunday: true,
          workOnHoliday: true,
        };

        let globalScheduleFilters = {
          showWetWork: true,
          showEndProduct: true,
          hiddenTasks: [],
          minFloor: 2,
          maxFloor: 7,
        };

        window.selectAllScheduleTasks = function () {
          globalScheduleFilters.hiddenTasks = [];
          renderScheduleFilter();
          renderScheduleTable();
          saveProjectDataToDB();
        };

        window.clearAllScheduleTasks = function () {
          // Hide all tasks that are currently visible in the filter
          const visibleTaskIndices = globalScheduleTasks
            .map((t, i) => i)
            .filter((i) => {
              const task = globalScheduleTasks[i];
              if (
                task.category === "wetwork" &&
                !globalScheduleFilters.showWetWork
              )
                return false;
              if (
                task.category === "endproduct" &&
                !globalScheduleFilters.showEndProduct
              )
                return false;
              return true;
            });

          // Add all visible tasks to hiddenTasks if not already there
          visibleTaskIndices.forEach((idx) => {
            if (!globalScheduleFilters.hiddenTasks.includes(idx)) {
              globalScheduleFilters.hiddenTasks.push(idx);
            }
          });

          renderScheduleFilter();
          renderScheduleTable();
          saveProjectDataToDB();
        };

        window.updateMaxFloor = function (newMax) {
          const val = parseInt(newMax);
          if (isNaN(val) || val < 2) return;

          const currentMax =
            globalScheduleData.length > 0
              ? Math.max(...globalScheduleData.map((f) => f.id))
              : 1;

          if (val > currentMax) {
            // Add floors
            for (let i = currentMax + 1; i <= val; i++) {
              const lastFloor = globalScheduleData.find(
                (f) => f.id === currentMax,
              );
              // Clone last floor's plan and add 7 days offset as a default
              const newPlan = lastFloor.plan.map((dateStr) => {
                if (!dateStr) return "";
                const d = new Date(dateStr);
                d.setDate(d.getDate() + 7);
                return d.toISOString().split("T")[0];
              });
              globalScheduleData.push({
                id: i,
                plan: newPlan,
                actual: new Array(48).fill(""),
              });
            }
          } else if (val < currentMax) {
            // Remove floors
            globalScheduleData = globalScheduleData.filter((f) => f.id <= val);
          }

          globalScheduleFilters.maxFloor = val;
          if (globalScheduleFilters.minFloor > val)
            globalScheduleFilters.minFloor = val;

          renderScheduleTable();
          renderScheduleFilter();
          renderScheduleSettings();
          renderExecutiveSummaryDashboard();
          saveProjectDataToDB();
        };

        window.updateFloorRange = function (type, value) {
          const val = parseInt(value);
          if (type === "min") globalScheduleFilters.minFloor = val;
          if (type === "max") globalScheduleFilters.maxFloor = val;
          renderScheduleTable();
          renderScheduleExecutiveSummary(
            document.getElementById("executive-summary-dashboard"),
          );
          saveProjectDataToDB();
        };

        function formatThaiDateShort(dateStr) {
          if (!dateStr) return "";
          if (dateStr === "DONE")
            return '<span class="text-green-600 font-bold text-sm">✓</span>';
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return "";
          const months = [
            "ม.ค.",
            "ก.พ.",
            "มี.ค.",
            "เม.ย.",
            "พ.ค.",
            "มิ.ย.",
            "ก.ค.",
            "ส.ค.",
            "ก.ย.",
            "ต.ค.",
            "พ.ย.",
            "ธ.ค.",
          ];
          const d = date.getDate();
          const m = months[date.getMonth()];
          const y = (date.getFullYear() + 543).toString().slice(-2);
          return `${d} ${m} ${y}`;
        }

        function getMonthColorClass(dateStr) {
          if (!dateStr) return "bg-white text-slate-700";
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return "bg-white text-slate-700";
          const month = date.getMonth();
          const colors = [
            "bg-blue-100 text-blue-900", // Jan
            "bg-pink-100 text-pink-900", // Feb
            "bg-green-100 text-green-900", // Mar
            "bg-yellow-100 text-yellow-900", // Apr
            "bg-purple-100 text-purple-900", // May
            "bg-teal-100 text-teal-900", // Jun
            "bg-indigo-100 text-indigo-900", // Jul
            "bg-rose-100 text-rose-900", // Aug
            "bg-orange-100 text-orange-900", // Sep
            "bg-cyan-100 text-cyan-900", // Oct
            "bg-fuchsia-100 text-fuchsia-900", // Nov
            "bg-emerald-100 text-emerald-900", // Dec
          ];
          return colors[month];
        }

        window.openScheduleFilterModal = function () {
          renderScheduleFilter();
          const filterContainer = document.getElementById("schedule-filter");
          if (filterContainer) filterContainer.classList.remove("hidden");
          openModal('scheduleFilterModal');
        };

        window.openScheduleSettingsModal = function () {
          renderScheduleSettings();
          const settingsContainer = document.getElementById("schedule-settings");
          if (settingsContainer) settingsContainer.classList.remove("hidden");
          openModal('scheduleSettingsModal');
        };

        function parseThaiDate(thaiStr) {
          if (!thaiStr) return "";
          const months = {
            "ม.ค.": "01",
            "ก.พ.": "02",
            "มี.ค.": "03",
            "เม.ย.": "04",
            "พ.ค.": "05",
            "มิ.ย.": "06",
            "ก.ค.": "07",
            "ส.ค.": "08",
            "ก.ย.": "09",
            "ต.ค.": "10",
            "พ.ย.": "11",
            "ธ.ค.": "12",
          };
          const parts = thaiStr.trim().split(" ");
          if (parts.length !== 3) return "";
          let d = parts[0].padStart(2, "0");
          let m = months[parts[1]];
          let y = "20" + parts[2];
          return `${y}-${m}-${d}`;
        }

        let globalScheduleData = [
          {
            id: 2,
            plan: [
              "3 พ.ย. 23",
              "7 พ.ย. 23",
              "7 พ.ย. 23",
              "9 พ.ย. 23",
              "10 พ.ย. 23",
              "16 พ.ย. 23",
              "15 พ.ย. 23",
              "16 พ.ย. 23",
              "17 พ.ย. 23",
              "27 พ.ย. 23",
              "22 พ.ย. 23",
              "1 ธ.ค. 23",
              "26 พ.ย. 23",
              "2 ธ.ค. 23",
              "28 พ.ย. 23",
              "4 ธ.ค. 23",
              "2 ธ.ค. 23",
              "15 ธ.ค. 23",
              "9 ธ.ค. 23",
              "18 ธ.ค. 23",
              "11 ธ.ค. 23",
              "17 ธ.ค. 23",
              "15 ธ.ค. 23",
              "24 ธ.ค. 23",
              "19 ธ.ค. 23",
              "28 ธ.ค. 23",
              "15 ก.ค. 24",
              "21 ก.ค. 24",
              "15 ก.ค. 24",
              "21 ก.ค. 24",
              "15 ก.ค. 24",
              "21 ก.ค. 24",
              "15 ก.ค. 24",
              "21 ก.ค. 24",
              "15 ก.ค. 24",
              "21 ก.ค. 24",
              "20 ก.ค. 24",
              "25 ก.ค. 24",
              "25 ก.ค. 24",
              "31 ก.ค. 24",
              "22 ก.ค. 24",
              "28 ก.ค. 24",
              "23 ก.ค. 24",
              "30 ก.ค. 24",
              "24 ก.ค. 24",
              "31 ก.ค. 24",
              "31 ก.ค. 24",
              "9 ส.ค. 24",
            ].map(parseThaiDate),
          },
          {
            id: 3,
            plan: [
              "6 พ.ย. 23",
              "12 พ.ย. 23",
              "9 พ.ย. 23",
              "15 พ.ย. 23",
              "9 พ.ย. 23",
              "18 พ.ย. 23",
              "12 พ.ย. 23",
              "18 พ.ย. 23",
              "14 พ.ย. 23",
              "23 พ.ย. 23",
              "19 พ.ย. 23",
              "28 พ.ย. 23",
              "23 พ.ย. 23",
              "29 พ.ย. 23",
              "25 พ.ย. 23",
              "1 ธ.ค. 23",
              "29 พ.ย. 23",
              "12 ธ.ค. 23",
              "6 ธ.ค. 23",
              "15 ธ.ค. 23",
              "8 ธ.ค. 23",
              "14 ธ.ค. 23",
              "12 ธ.ค. 23",
              "21 ธ.ค. 23",
              "16 ธ.ค. 23",
              "25 ธ.ค. 23",
              "22 ก.ค. 24",
              "28 ก.ค. 24",
              "22 ก.ค. 24",
              "28 ก.ค. 24",
              "22 ก.ค. 24",
              "28 ก.ค. 24",
              "22 ก.ค. 24",
              "28 ก.ค. 24",
              "22 ก.ค. 24",
              "28 ก.ค. 24",
              "27 ก.ค. 24",
              "1 ส.ค. 24",
              "1 ส.ค. 24",
              "7 ส.ค. 24",
              "29 ก.ค. 24",
              "4 ส.ค. 24",
              "30 ก.ค. 24",
              "6 ส.ค. 24",
              "31 ก.ค. 24",
              "7 ส.ค. 24",
              "10 ส.ค. 24",
              "24 ส.ค. 24",
            ].map(parseThaiDate),
          },
          {
            id: 4,
            plan: [
              "13 พ.ย. 23",
              "19 พ.ย. 23",
              "16 พ.ย. 23",
              "22 พ.ย. 23",
              "16 พ.ย. 23",
              "25 พ.ย. 23",
              "19 พ.ย. 23",
              "25 พ.ย. 23",
              "21 พ.ย. 23",
              "30 พ.ย. 23",
              "26 พ.ย. 23",
              "5 ธ.ค. 23",
              "30 พ.ย. 23",
              "6 ธ.ค. 23",
              "2 ธ.ค. 23",
              "8 ธ.ค. 23",
              "6 ธ.ค. 23",
              "19 ธ.ค. 23",
              "13 ธ.ค. 23",
              "22 ธ.ค. 23",
              "15 ธ.ค. 23",
              "21 ธ.ค. 23",
              "19 ธ.ค. 23",
              "28 ธ.ค. 23",
              "23 ธ.ค. 23",
              "1 ม.ค. 24",
              "31 ก.ค. 24",
              "6 ส.ค. 24",
              "31 ก.ค. 24",
              "6 ส.ค. 24",
              "31 ก.ค. 24",
              "6 ส.ค. 24",
              "31 ก.ค. 24",
              "6 ส.ค. 24",
              "31 ก.ค. 24",
              "6 ส.ค. 24",
              "3 ส.ค. 24",
              "8 ส.ค. 24",
              "8 ส.ค. 24",
              "14 ส.ค. 24",
              "5 ส.ค. 24",
              "11 ส.ค. 24",
              "12 ส.ค. 24",
              "18 ส.ค. 24",
              "19 ส.ค. 24",
              "25 ส.ค. 24",
              "26 ส.ค. 24",
              "9 ก.ย. 24",
            ].map(parseThaiDate),
          },
          {
            id: 5,
            plan: [
              "20 พ.ย. 23",
              "26 พ.ย. 23",
              "23 พ.ย. 23",
              "29 พ.ย. 23",
              "23 พ.ย. 23",
              "2 ธ.ค. 23",
              "26 พ.ย. 23",
              "2 ธ.ค. 23",
              "28 พ.ย. 23",
              "7 ธ.ค. 23",
              "3 ธ.ค. 23",
              "12 ธ.ค. 23",
              "7 ธ.ค. 23",
              "13 ธ.ค. 23",
              "9 ธ.ค. 23",
              "15 ธ.ค. 23",
              "13 ธ.ค. 23",
              "26 ธ.ค. 23",
              "20 ธ.ค. 23",
              "29 ธ.ค. 23",
              "22 ธ.ค. 23",
              "28 ธ.ค. 23",
              "26 ธ.ค. 23",
              "4 ม.ค. 24",
              "30 ธ.ค. 23",
              "8 ม.ค. 24",
              "5 ส.ค. 24",
              "11 ส.ค. 24",
              "5 ส.ค. 24",
              "11 ส.ค. 24",
              "5 ส.ค. 24",
              "11 ส.ค. 24",
              "5 ส.ค. 24",
              "11 ส.ค. 24",
              "5 ส.ค. 24",
              "11 ส.ค. 24",
              "10 ส.ค. 24",
              "15 ส.ค. 24",
              "15 ส.ค. 24",
              "21 ส.ค. 24",
              "12 ส.ค. 24",
              "18 ส.ค. 24",
              "19 ส.ค. 24",
              "25 ส.ค. 24",
              "26 ส.ค. 24",
              "1 ก.ย. 24",
              "2 ก.ย. 24",
              "16 ก.ย. 24",
            ].map(parseThaiDate),
          },
          {
            id: 6,
            plan: [
              "27 พ.ย. 23",
              "3 ธ.ค. 23",
              "30 พ.ย. 23",
              "6 ธ.ค. 23",
              "30 พ.ย. 23",
              "9 ธ.ค. 23",
              "3 ธ.ค. 23",
              "9 ธ.ค. 23",
              "5 ธ.ค. 23",
              "14 ธ.ค. 23",
              "10 ธ.ค. 23",
              "19 ธ.ค. 23",
              "14 ธ.ค. 23",
              "20 ธ.ค. 23",
              "16 ธ.ค. 23",
              "22 ธ.ค. 23",
              "20 ธ.ค. 23",
              "2 ม.ค. 24",
              "27 ธ.ค. 23",
              "5 ม.ค. 24",
              "29 ธ.ค. 23",
              "4 ม.ค. 24",
              "2 ม.ค. 24",
              "11 ม.ค. 24",
              "6 ม.ค. 24",
              "15 ม.ค. 24",
              "12 ส.ค. 24",
              "18 ส.ค. 24",
              "12 ส.ค. 24",
              "18 ส.ค. 24",
              "12 ส.ค. 24",
              "18 ส.ค. 24",
              "12 ส.ค. 24",
              "18 ส.ค. 24",
              "12 ส.ค. 24",
              "18 ส.ค. 24",
              "17 ส.ค. 24",
              "22 ส.ค. 24",
              "22 ส.ค. 24",
              "28 ส.ค. 24",
              "19 ส.ค. 24",
              "25 ส.ค. 24",
              "26 ส.ค. 24",
              "1 ก.ย. 24",
              "2 ก.ย. 24",
              "8 ก.ย. 24",
              "9 ก.ย. 24",
              "23 ก.ย. 24",
            ].map(parseThaiDate),
          },
          {
            id: 7,
            plan: [
              "4 ธ.ค. 23",
              "10 ธ.ค. 23",
              "7 ธ.ค. 23",
              "13 ธ.ค. 23",
              "7 ธ.ค. 23",
              "16 ธ.ค. 23",
              "10 ธ.ค. 23",
              "16 ธ.ค. 23",
              "12 ธ.ค. 23",
              "21 ธ.ค. 23",
              "17 ธ.ค. 23",
              "26 ธ.ค. 23",
              "21 ธ.ค. 23",
              "27 ธ.ค. 23",
              "23 ธ.ค. 23",
              "29 ธ.ค. 23",
              "27 ธ.ค. 23",
              "9 ม.ค. 24",
              "3 ม.ค. 24",
              "12 ม.ค. 24",
              "5 ม.ค. 24",
              "11 ม.ค. 24",
              "9 ม.ค. 24",
              "18 ม.ค. 24",
              "13 ม.ค. 24",
              "22 ม.ค. 24",
              "19 ส.ค. 24",
              "25 ส.ค. 24",
              "19 ส.ค. 24",
              "25 ส.ค. 24",
              "19 ส.ค. 24",
              "25 ส.ค. 24",
              "19 ส.ค. 24",
              "25 ส.ค. 24",
              "19 ส.ค. 24",
              "25 ส.ค. 24",
              "24 ส.ค. 24",
              "29 ส.ค. 24",
              "29 ส.ค. 24",
              "4 ก.ย. 24",
              "26 ส.ค. 24",
              "1 ก.ย. 24",
              "2 ก.ย. 24",
              "8 ก.ย. 24",
              "9 ก.ย. 24",
              "15 ก.ย. 24",
              "16 ก.ย. 24",
              "30 ก.ย. 24",
            ].map(parseThaiDate),
          },
        ];

        globalScheduleData.forEach((floor) => {
          if (!floor.actual) floor.actual = new Array(48).fill("");
        });

        const THAI_HOLIDAYS = [
          // 2025
          "2025-01-01",
          "2025-02-12",
          "2025-04-06",
          "2025-04-13",
          "2025-04-14",
          "2025-04-15",
          "2025-05-01",
          "2025-05-04",
          "2025-05-11",
          "2025-06-03",
          "2025-07-10",
          "2025-07-11",
          "2025-07-28",
          "2025-08-12",
          "2025-10-13",
          "2025-10-23",
          "2025-12-05",
          "2025-12-10",
          "2025-12-31",
          // 2026
          "2026-01-01",
          "2026-01-02",
          "2026-03-03",
          "2026-04-06",
          "2026-04-13",
          "2026-04-14",
          "2026-04-15",
          "2026-05-01",
          "2026-05-04",
          "2026-05-31",
          "2026-06-01",
          "2026-06-03",
          "2026-07-28",
          "2026-07-29",
          "2026-07-30",
          "2026-08-12",
          "2026-10-13",
          "2026-10-23",
          "2026-12-05",
          "2026-12-07",
          "2026-12-10",
          "2026-12-31",
        ];

        function checkIsHoliday(dateObj) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;
          return THAI_HOLIDAYS.includes(dateStr);
        }

        function addWorkingDays(startDateStr, daysToAdd) {
          if (!startDateStr) return "";
          let date = new Date(startDateStr);
          if (isNaN(date.getTime())) return "";

          let added = 0;
          let daysToActuallyAdd = Math.max(0, daysToAdd - 1);

          while (added < daysToActuallyAdd) {
            date.setDate(date.getDate() + 1);
            let dayOfWeek = date.getDay();
            let isSunday = dayOfWeek === 0;
            let isHoliday = checkIsHoliday(date);

            if (
              (!isSunday || globalScheduleSettings.workOnSunday) &&
              (!isHoliday || globalScheduleSettings.workOnHoliday)
            ) {
              added++;
            }
          }
          return date.toISOString().split("T")[0];
        }

        function shiftWorkingDays(startDateStr, shiftDays) {
          if (!startDateStr) return "";
          let date = new Date(startDateStr);
          if (isNaN(date.getTime())) return "";

          if (shiftDays === 0) return startDateStr;

          let step = shiftDays > 0 ? 1 : -1;
          let remaining = Math.abs(shiftDays);

          while (remaining > 0) {
            date.setDate(date.getDate() + step);
            let dayOfWeek = date.getDay();
            let isSunday = dayOfWeek === 0;
            let isHoliday = checkIsHoliday(date);

            if (
              (!isSunday || globalScheduleSettings.workOnSunday) &&
              (!isHoliday || globalScheduleSettings.workOnHoliday)
            ) {
              remaining--;
            }
          }
          return date.toISOString().split("T")[0];
        }

        function getNextWorkingDay(dateStr) {
          if (!dateStr) return "";
          let date = new Date(dateStr);
          if (isNaN(date.getTime())) return "";

          let found = false;
          while (!found) {
            date.setDate(date.getDate() + 1);
            let dayOfWeek = date.getDay();
            let isSunday = dayOfWeek === 0;
            let isHoliday = checkIsHoliday(date);

            if (
              (!isSunday || globalScheduleSettings.workOnSunday) &&
              (!isHoliday || globalScheduleSettings.workOnHoliday)
            ) {
              found = true;
            }
          }
          return date.toISOString().split("T")[0];
        }

        let currentActualUpdateContext = null;

        window.openActualUpdateModal = function (floorId, taskIndex, isStart) {
          const floor = globalScheduleData.find((f) => f.id === floorId);
          const task = globalScheduleTasks[taskIndex];
          if (!floor || !task) return;

          currentActualUpdateContext = { floorId, taskIndex, isStart };

          const subtitleEl = document.getElementById("actual-update-subtitle");
          const dateInput = document.getElementById("actual-update-date");

          subtitleEl.textContent = `ชั้น ${floor.id} - ${task.name} (${isStart ? "เริ่ม" : "แล้วเสร็จ"})`;

          const currentValue = floor.actual[taskIndex * 2 + (isStart ? 0 : 1)];
          if (currentValue && currentValue !== "DONE") {
            dateInput.value = currentValue;
          } else {
            dateInput.value = "";
          }

          openModal("actualUpdateModal");
          if (window.lucide) lucide.createIcons();
        };

        window.closeActualUpdateModal = function () {
          closeModal("actualUpdateModal");
          currentActualUpdateContext = null;
        };

        window.saveActualDate = function () {
          if (!currentActualUpdateContext) return;
          const { floorId, taskIndex, isStart } = currentActualUpdateContext;
          const dateVal = document.getElementById("actual-update-date").value;

          if (dateVal) {
            handleActualDateChange(floorId, taskIndex, isStart, dateVal);
          }
          closeActualUpdateModal();
        };

        window.saveActualDone = function () {
          if (!currentActualUpdateContext) return;
          const { floorId, taskIndex, isStart } = currentActualUpdateContext;
          handleActualDateChange(floorId, taskIndex, isStart, "DONE");
          closeActualUpdateModal();
        };

        window.clearActualData = function () {
          if (!currentActualUpdateContext) return;
          const { floorId, taskIndex, isStart } = currentActualUpdateContext;
          handleActualDateChange(floorId, taskIndex, isStart, "");
          closeActualUpdateModal();
        };

        window.handleActualDateChange = function (
          floorId,
          taskIndex,
          isStart,
          newValue,
        ) {
          const floor = globalScheduleData.find((f) => f.id === floorId);
          if (!floor) return;
          floor.actual[taskIndex * 2 + (isStart ? 0 : 1)] = newValue;
          renderScheduleTable();
          saveProjectDataToDB();
        };

        window.handleScheduleDateChange = function (
          floorId,
          taskIndex,
          isStart,
          newValue,
        ) {
          const floor = globalScheduleData.find((f) => f.id === floorId);
          if (!floor) return;

          floor.plan[taskIndex * 2 + (isStart ? 0 : 1)] = newValue;

          if (isStart && newValue) {
            const duration = globalScheduleTasks[taskIndex].duration;
            const endDate = addWorkingDays(newValue, duration);
            floor.plan[taskIndex * 2 + 1] = endDate;

            let currentEndDate = endDate;
            for (let i = taskIndex + 1; i < globalScheduleTasks.length; i++) {
              const nextStartDate = getNextWorkingDay(currentEndDate);
              floor.plan[i * 2] = nextStartDate;

              const nextDuration = globalScheduleTasks[i].duration;
              currentEndDate = addWorkingDays(nextStartDate, nextDuration);
              floor.plan[i * 2 + 1] = currentEndDate;
            }
          } else if (!isStart && newValue) {
            let currentEndDate = newValue;
            for (let i = taskIndex + 1; i < globalScheduleTasks.length; i++) {
              const nextStartDate = getNextWorkingDay(currentEndDate);
              floor.plan[i * 2] = nextStartDate;

              const nextDuration = globalScheduleTasks[i].duration;
              currentEndDate = addWorkingDays(nextStartDate, nextDuration);
              floor.plan[i * 2 + 1] = currentEndDate;
            }
          }

          renderScheduleTable();
          saveProjectDataToDB();
        };

        window.updateScheduleSetting = function (key, value) {
          globalScheduleSettings[key] = value;

          recalculateAllPlanDates();

          renderScheduleSettings();
          renderScheduleTable();
          renderScheduleFilter();
          updateProjectTotalDisplay();

          saveProjectDataToDB();
        };

        window.updateTaskDuration = function (index, value) {
          const duration = parseInt(value) || 0;
          globalScheduleTasks[index].duration = duration;

          // Update task name with new duration
          globalScheduleTasks[index].name = globalScheduleTasks[
            index
          ].name.replace(/\(\d+\s*วัน\)/, `(${duration}วัน)`);

          // Recalculate all dates in the schedule to reflect duration changes
          recalculateAllPlanDates();

          // Calculate new totals
          const wetWorkTasks = globalScheduleTasks.filter(
            (t) => t.category === "wetwork",
          );
          const endProductTasks = globalScheduleTasks.filter(
            (t) => t.category === "endproduct",
          );
          const totalWetWork = wetWorkTasks.reduce(
            (sum, t) => sum + t.duration,
            0,
          );
          const totalEndProduct = endProductTasks.reduce(
            (sum, t) => sum + t.duration,
            0,
          );
          const totalAll = totalWetWork + totalEndProduct;

          // Update totals in UI surgically to avoid focus loss
          const elTotalAll = document.getElementById("total-all-days-val");
          const elTotalWet = document.getElementById("total-wetwork-days-val");
          const elTotalEnd = document.getElementById(
            "total-endproduct-days-val",
          );

          if (elTotalAll) elTotalAll.innerText = `${totalAll} วัน`;
          if (elTotalWet) elTotalWet.innerText = `${totalWetWork} วัน`;
          if (elTotalEnd) elTotalEnd.innerText = `${totalEndProduct} วัน`;

          // Re-render other parts that depend on this
          renderScheduleTable();
          renderScheduleFilter();

          // Update Project Total surgically after table re-render
          updateProjectTotalDisplay();

          // We skip renderScheduleSettings() here to keep focus on the current input
          saveProjectDataToDB();
        };

        window.updateTaskOffset = function (index, value) {
          const offset = parseInt(value) || 0;
          globalScheduleTasks[index].offsetDays = offset;

          recalculateAllPlanDates();

          renderScheduleTable();
          renderScheduleFilter();
          updateProjectTotalDisplay();

          saveProjectDataToDB();
        };

        function recalculateAllPlanDates() {
          globalScheduleData.forEach((floor) => {
            // Start with the first task's start date as the anchor
            let currentStartDate = floor.plan[0];
            if (!currentStartDate) return;

            for (let i = 0; i < globalScheduleTasks.length; i++) {
              if (i > 0) {
                // Start date of task i is the next working day after end date of task i-1
                const prevEndDate = floor.plan[(i - 1) * 2 + 1];
                let nextStart = getNextWorkingDay(prevEndDate);

                const offset = globalScheduleTasks[i].offsetDays || 0;
                if (offset !== 0) {
                  nextStart = shiftWorkingDays(nextStart, offset);
                }
                currentStartDate = nextStart;
                floor.plan[i * 2] = currentStartDate;
              }

              const duration = globalScheduleTasks[i].duration;
              const endDate = addWorkingDays(currentStartDate, duration);
              floor.plan[i * 2 + 1] = endDate;
            }
          });
        }

        function getDurationForTasksOnFirstFloor(tasks) {
          if (globalScheduleData.length === 0) return 0;
          const firstFloor = globalScheduleData[0];
          const taskIndices = tasks.map((t) => t.index);
          let dates = [];
          taskIndices.forEach((idx) => {
            if (firstFloor.plan[idx * 2])
              dates.push(new Date(firstFloor.plan[idx * 2]).getTime());
            if (firstFloor.plan[idx * 2 + 1])
              dates.push(new Date(firstFloor.plan[idx * 2 + 1]).getTime());
          });

          if (dates.length > 0) {
            const minDate = Math.min(...dates);
            const maxDate = Math.max(...dates);
            const diffTime = Math.abs(maxDate - minDate);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          }
          return 0;
        }

        function updateProjectTotalDisplay() {
          const elTotalProject = document.getElementById(
            "total-project-days-val",
          );
          const elTotalWetWork = document.getElementById(
            "total-wetwork-days-val",
          );
          const elTotalEndProduct = document.getElementById(
            "total-endproduct-days-val",
          );
          const elTotalAll = document.getElementById("total-all-days-val");

          if (!elTotalProject) return;

          const allPlanDates = globalScheduleData
            .filter(
              (f) =>
                f.id >= globalScheduleFilters.minFloor &&
                f.id <= globalScheduleFilters.maxFloor,
            )
            .flatMap((f) => f.plan)
            .filter((d) => d);

          if (allPlanDates.length > 0) {
            const dates = allPlanDates.map((d) => new Date(d).getTime());
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            const diffTime = Math.abs(maxDate - minDate);
            const totalProjectDays =
              Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            elTotalProject.innerText = `${totalProjectDays} วัน`;
          } else {
            elTotalProject.innerText = "-";
          }

          const wetWorkTasks = globalScheduleTasks
            .map((task, index) => ({ task, index }))
            .filter((t) => t.task.category === "wetwork");
          const endProductTasks = globalScheduleTasks
            .map((task, index) => ({ task, index }))
            .filter((t) => t.task.category === "endproduct");

          if (elTotalWetWork)
            elTotalWetWork.innerText = `${getDurationForTasksOnFirstFloor(wetWorkTasks)} วัน`;
          if (elTotalEndProduct)
            elTotalEndProduct.innerText = `${getDurationForTasksOnFirstFloor(endProductTasks)} วัน`;
          if (elTotalAll)
            elTotalAll.innerText = `${getDurationForTasksOnFirstFloor([...wetWorkTasks, ...endProductTasks])} วัน`;
        }

        function renderScheduleFilter() {
          const container = document.getElementById("schedule-filter");
          if (!container) return;

          let html = `
                    <div class="flex flex-col gap-6">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <h3 class="font-bold text-slate-800 text-xl flex items-center gap-2">
                                <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7.086V4z"></path></svg>
                                ตัวกรองแผนงาน
                            </h3>
                            
                            <div class="flex flex-wrap items-center gap-4">
                                <div class="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                    <span class="text-xs font-bold text-slate-500 px-2 uppercase tracking-wider">ชั้น:</span>
                                    <select onchange="updateFloorRange('min', this.value)" class="bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                                        ${globalScheduleData.map((f) => `<option value="${f.id}" ${globalScheduleFilters.minFloor === f.id ? "selected" : ""}>ชั้น ${f.id}</option>`).join("")}
                                    </select>
                                    <span class="text-slate-400">ถึง</span>
                                    <select onchange="updateFloorRange('max', this.value)" class="bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                                        ${globalScheduleData.map((f) => `<option value="${f.id}" ${globalScheduleFilters.maxFloor === f.id ? "selected" : ""}>ชั้น ${f.id}</option>`).join("")}
                                    </select>
                                </div>
                                
                                <div class="flex gap-2">
                                    <button onclick="selectAllScheduleTasks()" class="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100">เลือกทั้งหมด</button>
                                    <button onclick="clearAllScheduleTasks()" class="px-3 py-1.5 text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">ล้างทั้งหมด</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <!-- Categories -->
                            <div>
                                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">หมวดงานหลัก</h4>
                                <div class="flex gap-4">
                                    <label class="flex items-center gap-3 cursor-pointer group">
                                        <div class="relative flex items-center justify-center">
                                            <input type="checkbox" class="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-indigo-600 checked:bg-indigo-600 transition-all" 
                                                ${globalScheduleFilters.showWetWork ? "checked" : ""} 
                                                onchange="updateScheduleFilterCategory('wetwork', this.checked)">
                                            <svg class="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                        </div>
                                        <span class="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Wet Work</span>
                                    </label>
                                    <label class="flex items-center gap-3 cursor-pointer group">
                                        <div class="relative flex items-center justify-center">
                                            <input type="checkbox" class="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-indigo-600 checked:bg-indigo-600 transition-all" 
                                                ${globalScheduleFilters.showEndProduct ? "checked" : ""} 
                                                onchange="updateScheduleFilterCategory('endproduct', this.checked)">
                                            <svg class="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                        </div>
                                        <span class="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">End Product</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Individual Tasks -->
                            <div class="md:col-span-2">
                                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">เลือกงานย่อย</h4>
                                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                `;

          globalScheduleTasks.forEach((task, idx) => {
            let taskNameWithoutDuration = task.name.replace(
              /\s*\(\d+\s*วัน\)/,
              "",
            );
            let isHidden = globalScheduleFilters.hiddenTasks.includes(idx);

            if (
              (task.category === "wetwork" &&
                !globalScheduleFilters.showWetWork) ||
              (task.category === "endproduct" &&
                !globalScheduleFilters.showEndProduct)
            ) {
              return;
            }

            html += `
                        <label class="flex items-start gap-2 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                            <div class="relative flex items-center justify-center mt-0.5">
                                <input type="checkbox" class="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 checked:border-indigo-500 checked:bg-indigo-500 transition-all" 
                                    ${!isHidden ? "checked" : ""} 
                                    onchange="updateScheduleFilterTask(${idx}, this.checked)">
                                <svg class="absolute h-2.5 w-2.5 text-white opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                            </div>
                            <span class="text-xs font-medium text-slate-600 group-hover:text-slate-900 leading-tight" title="${taskNameWithoutDuration}">
                                <span class="font-bold text-slate-400 mr-1">${task.subName}</span>
                                ${taskNameWithoutDuration}
                            </span>
                        </label>
                    `;
          });

          html += `
                                </div>
                            </div>
                        </div>
                    </div>
                `;
          container.innerHTML = html;
        }

        window.updateScheduleFilterCategory = function (category, isChecked) {
          if (category === "wetwork") {
            globalScheduleFilters.showWetWork = isChecked;
          } else if (category === "endproduct") {
            globalScheduleFilters.showEndProduct = isChecked;
          }
          renderScheduleFilter();
          renderScheduleTable();
          saveProjectDataToDB();
        };

        window.quickFilterSchedule = function (category) {
          if (category === "wetwork") {
            globalScheduleFilters.showWetWork = true;
            globalScheduleFilters.showEndProduct = false;
          } else if (category === "endproduct") {
            globalScheduleFilters.showWetWork = false;
            globalScheduleFilters.showEndProduct = true;
          } else {
            globalScheduleFilters.showWetWork = true;
            globalScheduleFilters.showEndProduct = true;
          }
          globalScheduleFilters.hiddenTasks = [];
          renderScheduleFilter();
          renderScheduleTable();
          saveProjectDataToDB();

          // Update active states on the floating bar
          document
            .querySelectorAll(".schedule-quick-btn")
            .forEach((btn) =>
              btn.classList.remove("ring-4", "ring-indigo-200"),
            );
          if (category) {
            const activeBtn = document.getElementById(
              `quick-filter-${category}-btn`,
            );
            if (activeBtn) activeBtn.classList.add("ring-4", "ring-indigo-200");
          }
        };

        window.updateScheduleFilterTask = function (taskIdx, isChecked) {
          if (isChecked) {
            globalScheduleFilters.hiddenTasks =
              globalScheduleFilters.hiddenTasks.filter((id) => id !== taskIdx);
          } else {
            if (!globalScheduleFilters.hiddenTasks.includes(taskIdx)) {
              globalScheduleFilters.hiddenTasks.push(taskIdx);
            }
          }
          renderScheduleTable();
          saveProjectDataToDB();
        };

        function renderScheduleSettings() {
          const container = document.getElementById("schedule-settings");

          // Keep floating toggles in sync
          const sunToggle = document.getElementById(
            "quick-setting-sunday-toggle",
          );
          if (sunToggle)
            sunToggle.checked = globalScheduleSettings.workOnSunday;
          const textSunState = document.getElementById("text-sunday-state");
          if (textSunState) {
            textSunState.textContent = globalScheduleSettings.workOnSunday
              ? "✓"
              : "✗";
            textSunState.className = globalScheduleSettings.workOnSunday
              ? "text-emerald-500 text-lg leading-none"
              : "text-rose-500 text-lg leading-none";
          }

          const holToggle = document.getElementById(
            "quick-setting-holiday-toggle",
          );
          if (holToggle)
            holToggle.checked = globalScheduleSettings.workOnHoliday;
          const textHolState = document.getElementById("text-holiday-state");
          if (textHolState) {
            textHolState.textContent = globalScheduleSettings.workOnHoliday
              ? "✓"
              : "✗";
            textHolState.className = globalScheduleSettings.workOnHoliday
              ? "text-emerald-500 text-lg leading-none"
              : "text-rose-500 text-lg leading-none";
          }

          if (!container) return;

          const wetWorkTasks = globalScheduleTasks
            .map((task, index) => ({ task, index }))
            .filter((t) => t.task.category === "wetwork");
          const endProductTasks = globalScheduleTasks
            .map((task, index) => ({ task, index }))
            .filter((t) => t.task.category === "endproduct");

          const totalWetWorkDays =
            getDurationForTasksOnFirstFloor(wetWorkTasks);
          const totalEndProductDays =
            getDurationForTasksOnFirstFloor(endProductTasks);
          const totalAllDays = getDurationForTasksOnFirstFloor([
            ...wetWorkTasks,
            ...endProductTasks,
          ]);

          const allPlanDates = globalScheduleData
            .filter(
              (f) =>
                f.id >= globalScheduleFilters.minFloor &&
                f.id <= globalScheduleFilters.maxFloor,
            )
            .flatMap((f) => f.plan)
            .filter((d) => d);

          let totalProjectDays = 0;
          if (allPlanDates.length > 0) {
            const dates = allPlanDates.map((d) => new Date(d).getTime());
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            const diffTime = Math.abs(maxDate - minDate);
            totalProjectDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          }

          let html = `
                    <div class="flex flex-col gap-6">
                        <div class="flex justify-between items-center">
                            <h3 class="font-bold text-slate-700 text-lg flex items-center gap-2">
                                <i data-lucide="settings" class="w-5 h-5 text-indigo-500"></i>
                                ตั้งค่าแผนงาน (Schedule Configuration)
                            </h3>
                            <div class="flex gap-3">
                                <div class="px-4 py-2 bg-indigo-600 rounded-xl shadow-sm border border-indigo-500 flex flex-col items-center min-w-[140px]">
                                    <span class="text-[10px] font-black text-indigo-100 uppercase tracking-wider">ระยะเวลารวมต่อ 1 ชั้น</span>
                                    <span id="total-all-days-val" class="text-lg font-black text-white">${totalAllDays} วัน</span>
                                </div>
                                <div class="px-4 py-2 bg-slate-700 rounded-xl shadow-sm border border-slate-600 flex flex-col items-center min-w-[140px]">
                                    <span class="text-[10px] font-black text-slate-300 uppercase tracking-wider">ระยะเวลารวมทั้งโครงการ</span>
                                    <span id="total-project-days-val" class="text-lg font-black text-white">${totalProjectDays > 0 ? totalProjectDays + " วัน" : "-"}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex flex-wrap items-center gap-6 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-black text-slate-500 uppercase tracking-wider">จำนวนชั้นสูงสุด</label>
                                <div class="flex items-center gap-2">
                                    <input type="number" min="2" max="100" value="${globalScheduleFilters.maxFloor}" 
                                        class="w-24 p-2 border-2 border-slate-200 rounded-xl text-sm text-center font-black text-indigo-600 focus:border-indigo-500 outline-none transition-all"
                                        onchange="updateMaxFloor(this.value)">
                                    <span class="text-sm font-bold text-slate-400">ชั้น</span>
                                </div>
                            </div>

                            <div class="h-12 w-px bg-slate-100 mx-2 hidden md:block"></div>

                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-black text-slate-500 uppercase tracking-wider">วันทำงาน (Working Days)</label>
                                <div class="flex gap-6 mt-1">
                                    <label class="flex items-center gap-3 cursor-pointer group">
                                        <div class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" class="sr-only peer" 
                                                ${globalScheduleSettings.workOnSunday ? "checked" : ""} 
                                                onchange="updateScheduleSetting('workOnSunday', this.checked)">
                                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </div>
                                        <span class="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">ทำงานวันอาทิตย์</span>
                                    </label>
                                    <label class="flex items-center gap-3 cursor-pointer group">
                                        <div class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" class="sr-only peer" 
                                                ${globalScheduleSettings.workOnHoliday ? "checked" : ""} 
                                                onchange="updateScheduleSetting('workOnHoliday', this.checked)">
                                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </div>
                                        <span class="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">ทำงานวันหยุดนักขัตฤกษ์</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <!-- Wet Work Section -->
                            <div class="p-6 bg-emerald-50/40 rounded-2xl border-2 border-emerald-100 shadow-sm">
                                <div class="flex justify-between items-center mb-6 border-b-2 border-emerald-100 pb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 bg-emerald-500 rounded-lg shadow-sm">
                                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                        </div>
                                        <div>
                                            <h4 class="font-black text-emerald-900 text-base">Zone Wet Work</h4>
                                            <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">ขั้นตอน U1 - U26</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-1">รวมระยะเวลา</div>
                                        <div id="total-wetwork-days-val" class="text-xl font-black text-emerald-700">${totalWetWorkDays} วัน</div>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4">
                                    ${wetWorkTasks
                                      .map((t) => {
                                        const task = t.task;
                                        const idx = t.index;
                                        let taskNameWithoutDuration =
                                          task.name.replace(
                                            /\s*\(\d+\s*วัน\)/,
                                            "",
                                          );
                                        return `
                                            <div class="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between">
                                                <label class="text-xs font-bold text-slate-700 leading-snug block mb-3 line-clamp-2" title="${taskNameWithoutDuration}">${task.subName}: ${taskNameWithoutDuration}</label>
                                                <div class="flex gap-2 w-full">
                                                    <div class="flex-1 flex flex-col gap-1.5">
                                                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">เวลา(วัน)</span>
                                                        <input type="number" min="1" value="${task.duration}" 
                                                            class="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center font-bold text-emerald-700 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                                                            onchange="updateTaskDuration(${idx}, this.value)">
                                                    </div>
                                                    ${
                                                      idx > 0
                                                        ? `
                                                    <div class="flex-1 flex flex-col gap-1.5">
                                                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center" title="เริ่มก่อน/หลัง งานก่อนหน้า">เริ่ม(วัน)</span>
                                                        <input type="number" value="${task.offsetDays || 0}" 
                                                            class="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center font-bold text-amber-600 focus:bg-white focus:border-amber-500 outline-none transition-all shadow-inner"
                                                            onchange="updateTaskOffset(${idx}, this.value)">
                                                    </div>
                                                    `
                                                        : '<div class="flex-1"></div>'
                                                    }
                                                </div>
                                            </div>
                                        `;
                                      })
                                      .join("")}
                                </div>
                            </div>

                            <!-- End Product Section -->
                            <div class="p-6 bg-blue-50/40 rounded-2xl border-2 border-blue-100 shadow-sm">
                                <div class="flex justify-between items-center mb-6 border-b-2 border-blue-100 pb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 bg-blue-500 rounded-lg shadow-sm">
                                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                        <div>
                                            <h4 class="font-black text-blue-900 text-base">Zone End Product</h4>
                                            <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest">ขั้นตอน U27 - U38</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">รวมระยะเวลา</div>
                                        <div id="total-endproduct-days-val" class="text-xl font-black text-blue-700">${totalEndProductDays} วัน</div>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4">
                                    ${endProductTasks
                                      .map((t) => {
                                        const task = t.task;
                                        const idx = t.index;
                                        let taskNameWithoutDuration =
                                          task.name.replace(
                                            /\s*\(\d+\s*วัน\)/,
                                            "",
                                          );
                                        return `
                                            <div class="bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
                                                <label class="text-xs font-bold text-slate-700 leading-snug block mb-3 line-clamp-2" title="${taskNameWithoutDuration}">${task.subName}: ${taskNameWithoutDuration}</label>
                                                <div class="flex gap-2 w-full">
                                                    <div class="flex-1 flex flex-col gap-1.5">
                                                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">เวลา(วัน)</span>
                                                        <input type="number" min="1" value="${task.duration}" 
                                                            class="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center font-bold text-blue-700 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner"
                                                            onchange="updateTaskDuration(${idx}, this.value)">
                                                    </div>
                                                    ${
                                                      idx > 0
                                                        ? `
                                                    <div class="flex-1 flex flex-col gap-1.5">
                                                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center" title="เริ่มก่อน/หลัง งานก่อนหน้า">เริ่ม(วัน)</span>
                                                        <input type="number" value="${task.offsetDays || 0}" 
                                                            class="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center font-bold text-amber-600 focus:bg-white focus:border-amber-500 outline-none transition-all shadow-inner"
                                                            onchange="updateTaskOffset(${idx}, this.value)">
                                                    </div>
                                                    `
                                                        : '<div class="flex-1"></div>'
                                                    }
                                                </div>
                                            </div>
                                        `;
                                      })
                                      .join("")}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
          container.innerHTML = html;
          if (typeof lucide !== "undefined") lucide.createIcons();
        }

        let QC_HANDOVER_WEEKS = [
          { month: "ก.ย.", dates: "15-21", year: 2025 },
          { month: "ก.ย.", dates: "22-28", year: 2025 },
          { month: "ต.ค.", dates: "29-5", year: 2025 },
          { month: "ต.ค.", dates: "6-12", year: 2025 },
          { month: "ต.ค.", dates: "13-19", year: 2025 },
          { month: "ต.ค.", dates: "20-26", year: 2025 },
          { month: "พ.ย.", dates: "27-2", year: 2025 },
          { month: "พ.ย.", dates: "3-9", year: 2025 },
          { month: "พ.ย.", dates: "10-16", year: 2025 },
          { month: "พ.ย.", dates: "17-23", year: 2025 },
          { month: "พ.ย.", dates: "24-30", year: 2025 },
          { month: "ธ.ค.", dates: "1-7", year: 2025 },
          { month: "ธ.ค.", dates: "8-14", year: 2025 },
          { month: "ธ.ค.", dates: "15-21", year: 2025 },
          { month: "ธ.ค.", dates: "22-28", year: 2025 },
          { month: "ม.ค.", dates: "29-4", year: 2026 },
          { month: "ม.ค.", dates: "5-11", year: 2026 },
          { month: "ม.ค.", dates: "12-18", year: 2026 },
          { month: "ม.ค.", dates: "19-25", year: 2026 },
          { month: "ก.พ.", dates: "26-1", year: 2026 },
          { month: "ก.พ.", dates: "2-8", year: 2026 },
          { month: "ก.พ.", dates: "9-15", year: 2026 },
          { month: "ก.พ.", dates: "16-22", year: 2026 },
          { month: "มี.ค.", dates: "23-1", year: 2026 },
        ];

        const QC_HANDOVER_TYPES = {
          neuaFa: {
            label: "เหนือฝ้า",
            color: "bg-amber-500",
            textColor: "text-white",
            actualColor: "bg-amber-200",
            actualTextColor: "text-amber-900",
          },
          qcWW: {
            label: "QC WW",
            color: "bg-sky-500",
            textColor: "text-white",
            actualColor: "bg-sky-200",
            actualTextColor: "text-sky-900",
          },
          qcEnd: {
            label: "QC END",
            color: "bg-teal-500",
            textColor: "text-white",
            actualColor: "bg-teal-200",
            actualTextColor: "text-teal-900",
          },
        };

        let currentQCHandoverContext = null;

        window.openQCHandoverSettings = function () {
          const startDateInput = document.getElementById(
            "qc-settings-start-date",
          );
          const endDateInput = document.getElementById("qc-settings-end-date");
          const titleInput = document.getElementById("qc-settings-title");

          if (projectData.qcHandoverSettings) {
            startDateInput.value =
              projectData.qcHandoverSettings.startDate || "";
            endDateInput.value = projectData.qcHandoverSettings.endDate || "";
            titleInput.value =
              projectData.qcHandoverSettings.title || "แผนส่งห้อง QC";
          } else {
            // Default to current year if not set
            startDateInput.value = "2025-09-15";
            endDateInput.value = "2025-12-28";
            titleInput.value = "แผนส่งห้อง QC";
          }

          openModal("qc-handover-settings-modal");
        };

        window.closeQCHandoverSettings = function () {
          closeModal("qc-handover-settings-modal");
        };

        window.saveQCHandoverSettings = function () {
          const startDateStr = document.getElementById(
            "qc-settings-start-date",
          ).value;
          const endDateStr = document.getElementById(
            "qc-settings-end-date",
          ).value;
          const titleStr =
            document.getElementById("qc-settings-title").value ||
            "แผนส่งห้อง QC";

          if (!startDateStr || !endDateStr) {
            showToast("กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด");
            return;
          }

          const start = new Date(startDateStr);
          const end = new Date(endDateStr);

          if (start > end) {
            showToast("วันที่เริ่มต้นต้องก่อนวันที่สิ้นสุด");
            return;
          }

          projectData.qcHandoverSettings = {
            startDate: startDateStr,
            endDate: endDateStr,
            title: titleStr,
          };
          generateQCHandoverWeeks(startDateStr, endDateStr);
          saveProjectDataToDB();
          renderQCHandoverTable();
          updateUI();
          closeQCHandoverSettings();
          showToast("บันทึกการตั้งค่าแผนส่งห้องเรียบร้อย");
        };

        function generateQCHandoverWeeks(startDateStr, endDateStr) {
          const start = new Date(startDateStr);
          const end = new Date(endDateStr);
          const weeks = [];
          let current = new Date(start);

          // Adjust to Monday
          const day = current.getDay();
          const diff = current.getDate() - day + (day === 0 ? -6 : 1);
          current.setDate(diff);

          const thaiMonths = [
            "ม.ค.",
            "ก.พ.",
            "มี.ค.",
            "เม.ย.",
            "พ.ค.",
            "มิ.ย.",
            "ก.ค.",
            "ส.ค.",
            "ก.ย.",
            "ต.ค.",
            "พ.ย.",
            "ธ.ค.",
          ];

          while (current <= end) {
            const weekStart = new Date(current);
            const weekEnd = new Date(current);
            weekEnd.setDate(weekEnd.getDate() + 6);

            weeks.push({
              month: thaiMonths[weekStart.getMonth()],
              dates: `${weekStart.getDate()}-${weekEnd.getDate()}`,
              year: weekStart.getFullYear(),
              startDate: new Date(weekStart),
              endDate: new Date(weekEnd),
            });

            current.setDate(current.getDate() + 7);
          }

          QC_HANDOVER_WEEKS = weeks;
        }

        function openQCHandoverPopover(floorId, weekIndex, isPlan) {
          currentQCHandoverContext = { floorId, weekIndex, isPlan };
          const popover = document.getElementById("qc-handover-popover");
          const title = document.getElementById("qc-popover-title");
          const input = document.getElementById("qc-popover-input");

          title.innerText = `บันทึก ${isPlan ? "แผนงาน" : "ผลงานจริง"} (ชั้น ${floorId})`;

          // Pre-fill if exists
          if (!projectData.qcHandover)
            projectData.qcHandover = { data: {}, floorTotals: {} };
          const floorKey = `floor_${floorId}`;
          const weekKey = `week_${weekIndex}`;
          const cellData = projectData.qcHandover.data[floorKey]?.[weekKey];

          input.value = "";
          if (cellData) {
            if (isPlan && cellData.plan) {
              input.value = cellData.plan.value;
            }
          }

          popover.classList.remove("hidden");
          input.focus();
        }
        window.openQCHandoverPopover = openQCHandoverPopover;

        function closeQCHandoverPopover() {
          document
            .getElementById("qc-handover-popover")
            .classList.add("hidden");
          currentQCHandoverContext = null;
        }
        window.closeQCHandoverPopover = closeQCHandoverPopover;

        function saveQCHandoverData(type) {
          if (!currentQCHandoverContext) return;
          const { floorId, weekIndex, isPlan } = currentQCHandoverContext;
          const value =
            parseInt(document.getElementById("qc-popover-input").value) || 0;

          if (!projectData.qcHandover)
            projectData.qcHandover = { data: {}, floorTotals: {} };
          const floorKey = `floor_${floorId}`;
          const weekKey = `week_${weekIndex}`;

          if (!projectData.qcHandover.data[floorKey])
            projectData.qcHandover.data[floorKey] = {};
          if (!projectData.qcHandover.data[floorKey][weekKey])
            projectData.qcHandover.data[floorKey][weekKey] = {
              plan: null,
              actual: {},
            };

          if (isPlan) {
            projectData.qcHandover.data[floorKey][weekKey].plan = {
              type,
              value,
            };
          } else {
            projectData.qcHandover.data[floorKey][weekKey].actual[type] = value;
          }

          saveProjectDataToDB();
          renderQCHandoverTable();
          closeQCHandoverPopover();
        }
        window.saveQCHandoverData = saveQCHandoverData;

        function clearQCHandoverData() {
          if (!currentQCHandoverContext) return;
          const { floorId, weekIndex, isPlan } = currentQCHandoverContext;

          const floorKey = `floor_${floorId}`;
          const weekKey = `week_${weekIndex}`;

          if (projectData.qcHandover?.data[floorKey]?.[weekKey]) {
            if (isPlan) {
              projectData.qcHandover.data[floorKey][weekKey].plan = null;
            } else {
              projectData.qcHandover.data[floorKey][weekKey].actual = {};
            }
            saveProjectDataToDB();
            renderQCHandoverTable();
          }
          closeQCHandoverPopover();
        }
        window.clearQCHandoverData = clearQCHandoverData;

        function renderQCHandoverTable() {
          if (projectData.qcHandoverSettings) {
            generateQCHandoverWeeks(
              projectData.qcHandoverSettings.startDate,
              projectData.qcHandoverSettings.endDate,
            );
          }

          const mainTable = document.getElementById("main-table");
          mainTable.innerHTML = "";
          mainTable.classList.remove("hidden");

          mainTable.classList.remove("border-collapse");
          mainTable.classList.add("border-separate", "border-spacing-0");

          const reportHeader = document.getElementById("report-header");
          if (reportHeader) reportHeader.classList.remove("hidden");

          if (!projectData.qcHandover)
            projectData.qcHandover = { data: {}, floorTotals: {} };

          // Group weeks by month for header
          const monthGroups = [];
          QC_HANDOVER_WEEKS.forEach((w, i) => {
            if (
              monthGroups.length === 0 ||
              monthGroups[monthGroups.length - 1].month !== w.month
            ) {
              monthGroups.push({ month: w.month, count: 1 });
            } else {
              monthGroups[monthGroups.length - 1].count++;
            }
          });

          const thead = document.createElement("thead");
          let headerRow1 = `
                    <tr class="bg-slate-50">
                        <th class="border-t border-l border-b border-black p-3 text-sm font-bold text-slate-700 sticky left-0 z-40 bg-slate-50 shadow-[1px_0_0_0_#000]" rowspan="2" style="min-width: 60px;">ชั้น</th>
                        <th class="border-t border-l border-b border-black p-2 text-xs font-bold bg-amber-500 text-white uppercase tracking-wider" colspan="2">เหนือฝ้า</th>
                        <th class="border-t border-l border-b border-black p-2 text-xs font-bold bg-sky-500 text-white uppercase tracking-wider" colspan="2">QC WW</th>
                        <th class="border-t border-l border-b border-black p-2 text-xs font-bold bg-teal-500 text-white uppercase tracking-wider" colspan="2">QC END</th>
                        <th class="border-t border-l border-b border-black bg-slate-50" rowspan="2" style="min-width: 40px;"></th>
                        ${monthGroups.map((m, idx) => `<th class="border-t border-l border-b ${idx === monthGroups.length - 1 ? "border-r" : ""} border-black p-2 text-sm font-bold text-slate-700 bg-slate-200" colspan="${m.count}">${m.month}</th>`).join("")}
                    </tr>
                `;
          let headerRow2 = `
                    <tr class="bg-slate-50">
                        <th class="border-l border-b border-black p-1.5 text-xs font-medium bg-amber-400 text-amber-900">ทั้งหมด</th>
                        <th class="border-l border-b border-black p-1.5 text-xs font-medium bg-amber-400 text-amber-900">ส่ง</th>
                        <th class="border-l border-b border-black p-1.5 text-xs font-medium bg-sky-400 text-sky-900">ทั้งหมด</th>
                        <th class="border-l border-b border-black p-1.5 text-xs font-medium bg-sky-400 text-sky-900">ส่ง</th>
                        <th class="border-l border-b border-black p-1.5 text-xs font-medium bg-teal-400 text-teal-900">ทั้งหมด</th>
                        <th class="border-l border-b border-black p-1.5 text-xs font-medium bg-teal-400 text-teal-900">ส่ง</th>
                        ${QC_HANDOVER_WEEKS.map((w, idx) => `<th class="border-l border-b ${idx === QC_HANDOVER_WEEKS.length - 1 ? "border-r" : ""} border-black p-2 text-xs font-medium text-slate-600 bg-slate-100 min-w-[70px]">${w.dates}</th>`).join("")}
                    </tr>
                `;
          thead.innerHTML = headerRow1 + headerRow2;
          mainTable.appendChild(thead);

          const tbody = document.createElement("tbody");
          const floors = [2, 3, 4, 5, 6, 7, 8];

          floors.forEach((floorId) => {
            const floorKey = `floor_${floorId}`;
            const totals = projectData.qcHandover.floorTotals[floorKey] || {
              neuaFa: { total: 0 },
              qcWW: { total: 0 },
              qcEnd: { total: 0 },
            };

            // Calculate "ส่ง" (actual sum) and "ทั้งหมด" (plan sum)
            const sent = { neuaFa: 0, qcWW: 0, qcEnd: 0 };
            const planTotal = { neuaFa: 0, qcWW: 0, qcEnd: 0 };
            Object.values(projectData.qcHandover.data[floorKey] || {}).forEach(
              (week) => {
                if (week.actual) {
                  Object.keys(week.actual).forEach((type) => {
                    sent[type] += week.actual[type] || 0;
                  });
                }
                if (week.plan && week.plan.value) {
                  planTotal[week.plan.type] += week.plan.value;
                }
              },
            );

            const totalPlanAmount = planTotal.neuaFa + planTotal.qcWW + planTotal.qcEnd;
            let tempAccPlan = 0;
            let tempAccActual = 0;
            const weekStats = QC_HANDOVER_WEEKS.map((w, i) => {
              const weekKey = `week_${i}`;
              const planObj = projectData.qcHandover.data[floorKey]?.[weekKey]?.plan;
              const actualObj = projectData.qcHandover.data[floorKey]?.[weekKey]?.actual || {};
              const wPlan = planObj ? planObj.value : 0;
              const wActual = Object.values(actualObj).reduce((a, b) => a + (b || 0), 0);
              tempAccPlan += wPlan;
              tempAccActual += wActual;
              return { accPlan: tempAccPlan, accActual: tempAccActual, wPlan, wActual };
            });

            const now = new Date();
            now.setHours(0,0,0,0);

            // Plan Row
            const planRow = document.createElement("tr");
            let planCells = "";
            QC_HANDOVER_WEEKS.forEach((w, i) => {
              const weekKey = `week_${i}`;
              const cellData =
                projectData.qcHandover.data[floorKey]?.[weekKey]?.plan;
              let cellContent = "";
              let cellClass = "bg-white";

              if (cellData && cellData.value > 0) {
                const typeInfo = QC_HANDOVER_TYPES[cellData.type];
                cellClass = typeInfo.color + " " + typeInfo.textColor;
                cellContent = cellData.value;
              }
              planCells += `<td onclick="openQCHandoverPopover(${floorId}, ${i}, true)" class="border-l border-b ${i === QC_HANDOVER_WEEKS.length - 1 ? "border-r" : ""} border-black p-0 text-center text-sm font-medium cursor-pointer hover:opacity-80 transition-all ${cellClass}" style="height: 36px;">${cellContent}</td>`;
            });

            planRow.innerHTML = `
                        <td class="border-l border-b border-black p-2 text-sm font-bold text-slate-700 text-center sticky left-0 z-20 bg-white shadow-[1px_0_0_0_#000]" rowspan="2">${floorId}</td>
                        <td class="border-l border-b border-black p-1.5 text-center text-xs font-bold text-amber-700 bg-amber-50" rowspan="2">${planTotal.neuaFa}</td>
                        <td class="border-l border-b border-black p-1.5 text-center text-xs font-bold text-amber-700 bg-amber-50" rowspan="2">${sent.neuaFa}</td>
                        <td class="border-l border-b border-black p-1.5 text-center text-xs font-bold text-sky-700 bg-sky-50" rowspan="2">${planTotal.qcWW}</td>
                        <td class="border-l border-b border-black p-1.5 text-center text-xs font-bold text-sky-700 bg-sky-50" rowspan="2">${sent.qcWW}</td>
                        <td class="border-l border-b border-black p-1.5 text-center text-xs font-bold text-teal-700 bg-teal-50" rowspan="2">${planTotal.qcEnd}</td>
                        <td class="border-l border-b border-black p-1.5 text-center text-xs font-bold text-teal-700 bg-teal-50" rowspan="2">${sent.qcEnd}</td>
                        <td class="border-l border-b border-black p-1.5 text-xs text-center text-slate-600 bg-slate-50 font-bold">Plan</td>
                        ${planCells}
                    `;
            tbody.appendChild(planRow);

            // Actual Row
            const actualRow = document.createElement("tr");
            let actualCells = "";
            QC_HANDOVER_WEEKS.forEach((w, i) => {
              const weekKey = `week_${i}`;
              const actuals =
                projectData.qcHandover.data[floorKey]?.[weekKey]?.actual || {};
              const activeTypes = Object.keys(actuals).filter(
                (t) => actuals[t] > 0,
              );

              let cellContent = "";
              let cellClass = "bg-white";
              
              if (activeTypes.length === 1) {
                const type = activeTypes[0];
                const typeInfo = QC_HANDOVER_TYPES[type];
                cellClass = typeInfo.actualColor + " " + typeInfo.actualTextColor;
                cellContent = actuals[type];
              } else if (activeTypes.length > 1) {
                // Split view
                cellClass = "bg-slate-50";
                cellContent = `<div class="w-full h-full flex flex-col items-center justify-center gap-[1px] p-[1px]">
                                ${activeTypes
                                  .map((t) => {
                                    const typeInfo = QC_HANDOVER_TYPES[t];
                                    return `<div class="${typeInfo.actualColor} ${typeInfo.actualTextColor} text-[10px] leading-none px-1 py-0.5 rounded w-full text-center font-bold">${typeInfo.label.replace("QC ", "")}: ${actuals[t]}</div>`;
                                  })
                                  .join("")}
                            </div>`;
              }

              actualCells += `<td onclick="openQCHandoverPopover(${floorId}, ${i}, false)" class="border-l border-b ${i === QC_HANDOVER_WEEKS.length - 1 ? "border-r" : ""} border-black p-0 text-center text-sm font-medium cursor-pointer hover:opacity-80 transition-all ${cellClass}" style="height: 36px;">${cellContent}</td>`;
            });

            actualRow.innerHTML = `
                        <td class="border-l border-b border-black p-1.5 text-xs text-center text-slate-600 bg-slate-50 font-bold">Actual</td>
                        ${actualCells}
                    `;
            tbody.appendChild(actualRow);
          });

          // Footer Row: Summary Totals
          const footerRow = document.createElement("tr");
          const grandTotals = {
            neuaFa: { total: 0, sent: 0 },
            qcWW: { total: 0, sent: 0 },
            qcEnd: { total: 0, sent: 0 },
          };
          floors.forEach((fId) => {
            const fKey = `floor_${fId}`;

            Object.values(projectData.qcHandover.data[fKey] || {}).forEach(
              (week) => {
                if (week.plan && week.plan.value) {
                  grandTotals[week.plan.type].total += week.plan.value;
                }
                if (week.actual) {
                  grandTotals.neuaFa.sent += week.actual.neuaFa || 0;
                  grandTotals.qcWW.sent += week.actual.qcWW || 0;
                  grandTotals.qcEnd.sent += week.actual.qcEnd || 0;
                }
              },
            );
          });

          footerRow.innerHTML = `
                    <td class="border-l border-b border-black p-2 bg-slate-800 text-white font-bold text-center text-xs sticky left-0 z-20 shadow-[1px_0_0_0_#000]">รวมทั้งหมด</td>
                    <td class="border-l border-b border-black p-2 bg-amber-600 text-white font-bold text-center text-sm">${grandTotals.neuaFa.total}</td>
                    <td class="border-l border-b border-black p-2 bg-amber-600 text-white font-bold text-center text-sm">${grandTotals.neuaFa.sent}</td>
                    <td class="border-l border-b border-black p-2 bg-sky-600 text-white font-bold text-center text-sm">${grandTotals.qcWW.total}</td>
                    <td class="border-l border-b border-black p-2 bg-sky-600 text-white font-bold text-center text-sm">${grandTotals.qcWW.sent}</td>
                    <td class="border-l border-b border-black p-2 bg-teal-600 text-white font-bold text-center text-sm">${grandTotals.qcEnd.total}</td>
                    <td class="border-l border-b border-black p-2 bg-teal-600 text-white font-bold text-center text-sm">${grandTotals.qcEnd.sent}</td>
                    <td class="border-l border-b border-r border-black bg-slate-800" colspan="${QC_HANDOVER_WEEKS.length + 1}"></td>
                `;
          tbody.appendChild(footerRow);
          mainTable.appendChild(tbody);

          // Render Summary Tables below
          renderQCHandoverSummaryTables();
        }

        function renderQCHandoverSummaryTables() {
          const containerId = "qc-handover-summary-container";
          let container = document.getElementById(containerId);
          if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            container.className = "mt-8 flex flex-col gap-8 pb-20";
            document.getElementById("main-table").after(container);
          }
          container.innerHTML = "";

          const types = [
            { key: "neuaFa", label: "สรุป QC เหนือฝ้า", color: "bg-amber-500" },
            { key: "qcWW", label: "สรุป QC WW", color: "bg-sky-500" },
            { key: "qcEnd", label: "สรุป QC END", color: "bg-teal-500" },
          ];

          types.forEach((type) => {
            const table = document.createElement("div");
            table.className =
              "bg-white rounded-xl shadow-sm border border-black overflow-hidden";

            let weeklyData = QC_HANDOVER_WEEKS.map((w, i) => {
              let plan = 0;
              let actual = 0;
              [2, 3, 4, 5, 6, 7, 8].forEach((fId) => {
                const weekData =
                  projectData.qcHandover.data[`floor_${fId}`]?.[`week_${i}`];
                if (weekData) {
                  if (weekData.plan && weekData.plan.type === type.key)
                    plan += weekData.plan.value;
                  if (weekData.actual && weekData.actual[type.key])
                    actual += weekData.actual[type.key];
                }
              });
              return { plan, actual };
            });

            let accPlan = 0;
            let accActual = 0;
            const rows = weeklyData.map((d) => {
              accPlan += d.plan;
              accActual += d.actual;
              return { ...d, accPlan, accActual };
            });

            const totalPlanForType = rows[rows.length - 1].accPlan;
            const now = new Date();
            now.setHours(0,0,0,0);

            table.innerHTML = `
                        <div class="${type.color} p-3 text-white font-bold text-center text-sm">${type.label}</div>
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse text-xs">
                                <thead>
                                    <tr class="bg-slate-50">
                                        <th class="border-b border-r border-black p-2 sticky left-0 z-10 bg-slate-50 min-w-[80px] shadow-[1px_0_0_0_#000]"></th>
                                        ${QC_HANDOVER_WEEKS.map((w) => `<th class="border-b border-r border-black p-2 min-w-[70px] font-bold text-slate-600">${w.dates}/${w.month}</th>`).join("")}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="border-b border-r border-black p-2 font-bold sticky left-0 z-10 bg-white shadow-[1px_0_0_0_#000] text-slate-700">Plan</td>
                                        ${rows.map((r, i) => {
                                            const isBeforeStart = r.accPlan === 0 && r.accActual === 0;
                                            const isAfterPlanAllocated = i > 0 && rows[i-1].accPlan >= totalPlanForType && totalPlanForType > 0;
                                            let cellClass = "bg-white text-slate-700";
                                            if ((isBeforeStart && r.plan === 0) || (isAfterPlanAllocated && r.plan === 0)) cellClass = "bg-slate-200 text-transparent pointer-events-none";
                                            return `<td class="border-b border-r border-black p-2 text-center text-sm font-medium ${cellClass}">${r.plan}</td>`;
                                        }).join("")}
                                    </tr>
                                    <tr class="bg-slate-50">
                                        <td class="border-b border-r border-black p-2 font-bold sticky left-0 z-10 bg-slate-50 shadow-[1px_0_0_0_#000] text-slate-700">Acc. Plan</td>
                                        ${rows.map((r, i) => {
                                            const isBeforeStart = r.accPlan === 0 && r.accActual === 0;
                                            let cellClass = "bg-slate-50 text-blue-600";
                                            if (isBeforeStart && r.plan === 0) cellClass = "bg-slate-200 text-transparent pointer-events-none";
                                            return `<td class="border-b border-r border-black p-2 text-center text-sm font-bold ${cellClass}">${r.accPlan}</td>`;
                                        }).join("")}
                                    </tr>
                                    <tr>
                                        <td class="border-b border-r border-black p-2 font-bold sticky left-0 z-10 bg-white shadow-[1px_0_0_0_#000] text-slate-700">Actual</td>
                                        ${rows.map((r, i) => {
                                            const isBeforeStart = r.accPlan === 0 && r.accActual === 0;
                                            const isFuture = QC_HANDOVER_WEEKS[i].startDate > now;
                                            let cellClass = "bg-white text-slate-700";
                                            if (isFuture || (isBeforeStart && r.actual === 0)) cellClass = "bg-slate-200 text-transparent pointer-events-none";
                                            return `<td class="border-b border-r border-black p-2 text-center text-sm font-medium ${cellClass}">${r.actual}</td>`;
                                        }).join("")}
                                    </tr>
                                    <tr class="bg-slate-50">
                                        <td class="border-b border-r border-black p-2 font-bold sticky left-0 z-10 bg-slate-50 shadow-[1px_0_0_0_#000] text-slate-700">Acc. Actual</td>
                                        ${rows.map((r, i) => {
                                            const isBeforeStart = r.accPlan === 0 && r.accActual === 0;
                                            const isFuture = QC_HANDOVER_WEEKS[i].startDate > now;
                                            let cellClass = "bg-slate-50 text-emerald-600";
                                            if (isFuture || (isBeforeStart && r.actual === 0)) cellClass = "bg-slate-200 text-transparent pointer-events-none";
                                            return `<td class="border-b border-r border-black p-2 text-center text-sm font-bold ${cellClass}">${r.accActual}</td>`;
                                        }).join("")}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    `;
            container.appendChild(table);
          });
        }

        function renderScheduleTable() {
          const mainTable = document.getElementById("main-table");
          mainTable.innerHTML = "";
          mainTable.classList.remove("hidden");

          // Use border-separate and border-spacing-0 for better sticky column borders
          mainTable.classList.remove("border-collapse");
          mainTable.classList.add("border-separate", "border-spacing-0");

          const reportHeader = document.getElementById("report-header");
          if (reportHeader) reportHeader.classList.remove("hidden");

          renderExecutiveSummaryDashboard();
          renderScheduleFilter();

          const visibleTasks = globalScheduleTasks
            .map((task, index) => ({ task, index }))
            .filter(({ task, index }) => {
              if (
                task.category === "wetwork" &&
                !globalScheduleFilters.showWetWork
              )
                return false;
              if (
                task.category === "endproduct" &&
                !globalScheduleFilters.showEndProduct
              )
                return false;
              if (globalScheduleFilters.hiddenTasks.includes(index))
                return false;
              return true;
            });

          if (visibleTasks.length === 0) {
            mainTable.innerHTML =
              '<tr><td class="p-4 text-center text-slate-500">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>';
            return;
          }

          const thead = document.createElement("thead");
          thead.innerHTML = `
                    <tr class="bg-slate-100">
                        <th class="border-t border-l border-b border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 sticky left-0 z-30 bg-slate-100" rowspan="3" style="min-width: 70px;">อาคาร/ชั้น</th>
                        <th class="border-t border-l border-b border-slate-300 p-2 text-sm font-semibold text-slate-700 sticky left-[70px] z-30 bg-slate-100" rowspan="3" style="min-width: 45px;"></th>
                        ${visibleTasks.map((t) => `<th class="border-t border-l border-b border-slate-300 p-0 ${t.task.color}" colspan="2"><div class="p-2 text-sm font-semibold text-slate-800 mx-auto flex items-center justify-center text-center" style="min-width: 100px; max-width: 150px; white-space: normal; line-height: 1.35; word-break: break-word;">${t.task.name}</div></th>`).join("")}
                        <th class="border-t border-l border-r border-b border-slate-300" rowspan="3" style="width: 0;"></th>
                    </tr>
                    <tr class="bg-slate-50">
                        ${visibleTasks.map((t) => `<th class="border-l border-b border-slate-300 p-1.5 text-xs font-semibold text-center text-slate-700 ${t.task.color}" colspan="2">${t.task.subName}</th>`).join("")}
                    </tr>
                    <tr class="bg-slate-50">
                        ${visibleTasks
                          .map(
                            () => `
                            <th class="border-l border-b border-slate-300 p-1.5 text-[11px] font-medium text-slate-600" style="min-width: 50px;">เริ่ม</th>
                            <th class="border-l border-b border-slate-300 p-1.5 text-[11px] font-medium text-slate-600" style="min-width: 50px;">แล้วเสร็จ</th>
                        `,
                          )
                          .join("")}
                    </tr>
                `;
          mainTable.appendChild(thead);

          const tbody = document.createElement("tbody");
          globalScheduleData
            .filter(
              (f) =>
                f.id >= globalScheduleFilters.minFloor &&
                f.id <= globalScheduleFilters.maxFloor,
            )
            .forEach((floor) => {
              // Plan Row
              const planRow = document.createElement("tr");
              let planCells = "";
              visibleTasks.forEach((t) => {
                [true, false].forEach((isStart) => {
                  const idx = t.index * 2 + (isStart ? 0 : 1);
                  const dateStr = floor.plan[idx];
                  const colorClass = getMonthColorClass(dateStr);
                  const formattedDate = formatThaiDateShort(dateStr);
                  planCells += `<td class="border-l border-b border-slate-300 p-0 text-center relative hover:opacity-80 transition-opacity ${colorClass}" style="min-width: 50px; height: 30px;">
                                <div class="absolute inset-0 flex items-center justify-center pointer-events-none text-[11px] font-medium text-slate-700">${formattedDate}</div>
                                <input type="date" value="${dateStr}" 
                                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer date-picker-cover z-10"
                                    onclick="try { this.showPicker() } catch(e) {}"
                                    onchange="handleScheduleDateChange(${floor.id}, ${t.index}, ${isStart}, this.value)">
                            </td>`;
                });
              });

              planRow.innerHTML = `
                        <td class="border-l border-b border-slate-300 p-2 text-sm font-semibold text-slate-700 text-center sticky left-0 z-20 bg-white" rowspan="2">${floor.id}</td>
                        <td class="border-l border-b border-slate-300 p-1.5 text-xs font-medium text-slate-600 text-center sticky left-[70px] z-20 bg-white">แผน</td>
                        ${planCells}
                        <td class="border-l border-r border-b border-slate-300" rowspan="2"></td>
                    `;
              tbody.appendChild(planRow);

              // Actual Row
              const actualRow = document.createElement("tr");
              let actualCells = "";
              visibleTasks.forEach((t) => {
                [true, false].forEach((isStart) => {
                  const actualVal =
                    floor.actual[t.index * 2 + (isStart ? 0 : 1)] || "";
                  const planVal = floor.plan[t.index * 2 + (isStart ? 0 : 1)];
                  const colorClass = getMonthColorClass(
                    actualVal !== "DONE" ? actualVal : planVal,
                  );
                  const formattedDate = formatThaiDateShort(actualVal);

                  let displayContent = formattedDate;
                  const finishActual = floor.actual[t.index * 2 + 1];
                  let showCheckmark = false;

                  if (actualVal && actualVal !== "DONE") {
                    if (!isStart) {
                      showCheckmark = true;
                    } else if (isStart && finishActual) {
                      showCheckmark = true;
                    }
                  }

                  if (showCheckmark) {
                    displayContent = `<div class="flex flex-col items-center justify-center leading-tight mt-0.5">
                                    <span class="text-emerald-500 font-bold text-[13px] leading-none mb-0.5">✓</span>
                                    <span class="text-[11px] tracking-tight whitespace-nowrap text-slate-700">${formattedDate}</span>
                                </div>`;
                  } else if (actualVal && actualVal !== "DONE") {
                    displayContent = `<div class="text-[11px] font-medium tracking-tight whitespace-nowrap text-slate-700">${formattedDate}</div>`;
                  }

                  actualCells += `<td class="border-l border-b border-slate-300 p-0 text-center relative hover:opacity-80 transition-opacity cursor-pointer ${colorClass}" style="min-width: 50px; height: 34px;" onclick="openActualUpdateModal(${floor.id}, ${t.index}, ${isStart})">
                                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">${displayContent}</div>
                            </td>`;
                });
              });

              actualRow.innerHTML = `
                        <td class="border-l border-b border-slate-300 p-1.5 text-xs font-medium text-slate-600 text-center sticky left-[70px] z-20 bg-white">ผล</td>
                        ${actualCells}
                    `;
              tbody.appendChild(actualRow);
            });
          mainTable.appendChild(tbody);
        }

        function renderCommonAreaTable() {
          const mainTable = document.getElementById("main-table");
          mainTable.innerHTML = "";

          const { headerColor } = getHeaderColors();

          const thead = document.createElement("thead");
          let headerHTML = `<tr class="${headerColor}">
                    <th class="border p-2">LOCATION</th>
                    <th class="border p-2">DESCRIPTION</th>`;
          CONFIG.COMMON_AREA_FLOORS.forEach((floor) => {
            headerHTML += `<th class="border p-2">${floor}</th>`;
          });
          headerHTML += "</tr>";
          thead.innerHTML = headerHTML;
          mainTable.appendChild(thead);

          const tbody = document.createElement("tbody");
          Object.keys(commonAreaDefinitions).forEach((locKey) => {
            const locDef = commonAreaDefinitions[locKey];
            locDef.tasks.forEach((task, taskIndex) => {
              const row = document.createElement("tr");
              if (taskIndex === 0) {
                row.innerHTML += `<td class="border p-2 font-bold bg-slate-100 align-middle text-xl" rowspan="${locDef.tasks.length}">${locDef.locationName}</td>`;
              }
              row.innerHTML += `<td class="border p-2 text-left bg-slate-50">${task.taskName}</td>`;

              const taskData =
                projectData.commonArea?.[locKey]?.tasks?.[taskIndex];
              CONFIG.COMMON_AREA_FLOORS.forEach((floor) => {
                const progress = taskData?.progress?.[floor] || 0;
                const styleClasses = getProgressColor(progress);
                row.innerHTML += `<td class="border p-2 table-cell ${styleClasses}" data-location-key="${locKey}" data-task-index="${taskIndex}" data-floor="${floor}">${progress}%</td>`;
              });
              tbody.appendChild(row);
            });
          });
          mainTable.appendChild(tbody);
        }

        function renderQCSummaryTable() {
          const mainTable = document.getElementById("main-table");
          mainTable.innerHTML = "";

          const { headerColor, subHeaderColor } = getHeaderColors();

          const thead = document.createElement("thead");
          let headerHTML = `
                    <tr>
                        <th class="border border-slate-400 p-2 ${headerColor}" rowspan="2"><span>ชั้น</span></th>
                        <th class="border border-slate-400 p-2 ${headerColor}" rowspan="2"><span>รายการ</span></th>
                        <th class="border border-slate-400 p-2 ${headerColor}" colspan="${CONFIG.MAX_ROOMS}"><span>ROOM No.</span></th>
                        <th class="border-y border-slate-400 separator-cell" rowspan="2"></th>
                        <th class="border border-slate-400 p-2 ${headerColor}" colspan="3"><span>สรุปผลตรวจ</span></th>
                    </tr>
                    <tr>`;
          for (let i = 1; i <= CONFIG.MAX_ROOMS; i++) {
            headerHTML += `<th class="border border-slate-400 p-1 md:p-2 font-normal ${subHeaderColor}"><span>${i}</span></th>`;
          }
          headerHTML += `
                        <th class="border border-slate-400 p-2 ${subHeaderColor} font-semibold"><span>ส่งแล้ว</span></th>
                        <th class="border border-slate-400 p-2 ${subHeaderColor} font-semibold"><span>ผ่าน</span></th>
                        <th class="border border-slate-400 p-2 ${subHeaderColor} font-semibold"><span>ไม่ผ่าน</span></th>
                    </tr>`;
          thead.innerHTML = headerHTML;
          mainTable.appendChild(thead);

          const tbody = document.createElement("tbody");
          const totals = {
            wetWork: { submitted: 0, passed: 0, failed: 0 },
            endProduct: { submitted: 0, passed: 0, failed: 0 },
          };

          const renderCellContent = (unitData) => {
            let styleClasses = "bg-slate-50 text-slate-400";
            let cellText = "-";
            if (unitData.inInspection) {
              styleClasses = "bg-yellow-400 text-black";
              cellText = "รอคะแนน";
            } else {
              let scoreToShow = 0,
                defectToShow = false,
                stageLabel = "";
              if (
                unitData.qcScore > 0 &&
                unitData.qcScore === unitData.cmScore
              ) {
                scoreToShow = unitData.qcScore;
                defectToShow = unitData.qcHasMajorDefect;
                stageLabel = "QC-CM: ";
              } else if (unitData.qcScore > 0) {
                scoreToShow = unitData.qcScore;
                defectToShow = unitData.qcHasMajorDefect;
                stageLabel = "QC: ";
              } else if (unitData.cmScore > 0) {
                scoreToShow = unitData.cmScore;
                defectToShow = unitData.cmHasMajorDefect;
                stageLabel = "CM: ";
              }
              if (scoreToShow > 0) {
                styleClasses =
                  scoreToShow >= 85
                    ? "bg-teal-500 text-white"
                    : "bg-rose-500 text-white";
                cellText = `${stageLabel}${Number.isInteger(scoreToShow) ? scoreToShow : scoreToShow.toFixed(2)}`;
                if (defectToShow) {
                  cellText += "!";
                  if (showMajorDefectHighlight) {
                    styleClasses += " major-defect-highlight";
                  }
                }
              }
            }
            return { styleClasses, cellText };
          };

          CONFIG.FLOORS.forEach((floor, index) => {
            const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);

            const wetWorkRow = document.createElement("tr");
            const endProductRow = document.createElement("tr");

            // Add separation between floors
            const floorSeparatorClass =
              index === 0 ? "" : "border-t-2 border-slate-800 floor-separator";
            wetWorkRow.className = `${floorSeparatorClass} bg-slate-50/30 hover:bg-slate-50 transition-colors`;
            endProductRow.className = `bg-slate-50/30 hover:bg-slate-50 transition-colors border-b border-slate-400`;

            // Floor Cell (Sticky)
            wetWorkRow.innerHTML = `
                        <td class="border border-slate-400 p-2 font-black text-slate-700 align-middle text-center bg-white sticky left-0 z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]" rowspan="2" style="min-width: 50px;">
                            <span class="text-lg">${floor}</span>
                        </td>
                        <td class="border border-slate-400 p-2 font-bold text-blue-700 bg-blue-50/80 text-xs align-middle sticky left-[50px] z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap" style="min-width: 100px;">
                            <div class="flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Wet Work
                            </div>
                        </td>
                    `;
            endProductRow.innerHTML = `
                        <td class="border border-slate-400 p-2 font-bold text-emerald-700 bg-emerald-50/80 text-xs align-middle sticky left-[50px] z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] whitespace-nowrap" style="min-width: 100px;">
                            <div class="flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                End Product
                            </div>
                        </td>
                    `;

            let floorTotals = {
              wetWork: { submitted: 0, passed: 0, failed: 0 },
              endProduct: { submitted: 0, passed: 0, failed: 0 },
            };

            for (let room = 1; room <= CONFIG.MAX_ROOMS; room++) {
              if (room > CONFIG.getRoomsOnFloor(floor)) {
                wetWorkRow.innerHTML += `<td class="border border-slate-400 p-2 bg-slate-200"></td>`;
                endProductRow.innerHTML += `<td class="border border-slate-400 p-2 bg-slate-200"></td>`;
                continue;
              }

              // Wet Work Cell
              const wwData = projectData.wetWork?.[floor]?.[room] || {};
              const { styleClasses: wwStyle, cellText: wwText } =
                renderCellContent(wwData);
              const wwCell = document.createElement("td");
              wwCell.className = `border border-slate-400 p-2 table-cell ${wwStyle} transition-opacity hover:opacity-80 cursor-default`;
              wwCell.innerHTML = `<span class="percentage-text font-medium">${wwText}</span>`;
              wwCell.dataset.floor = floor;
              wwCell.dataset.room = room;
              wetWorkRow.appendChild(wwCell);

              // Count Wet Work stats
              if (
                wwData.inInspection ||
                wwData.qcScore > 0 ||
                wwData.cmScore > 0
              ) {
                floorTotals.wetWork.submitted++;
                if ((wwData.qcScore || wwData.cmScore) >= 85)
                  floorTotals.wetWork.passed++;
                else floorTotals.wetWork.failed++;
              }

              // End Product Cell
              const epData = projectData.endProduct?.[floor]?.[room] || {};
              const { styleClasses: epStyle, cellText: epText } =
                renderCellContent(epData);
              const epCell = document.createElement("td");
              epCell.className = `border border-slate-400 p-2 table-cell ${epStyle} transition-opacity hover:opacity-80 cursor-default`;
              epCell.innerHTML = `<span class="percentage-text font-medium">${epText}</span>`;
              epCell.dataset.floor = floor;
              epCell.dataset.room = room;
              endProductRow.appendChild(epCell);

              // Count End Product stats
              if (
                epData.inInspection ||
                epData.qcScore > 0 ||
                epData.cmScore > 0
              ) {
                floorTotals.endProduct.submitted++;
                if ((epData.qcScore || epData.cmScore) >= 85)
                  floorTotals.endProduct.passed++;
                else floorTotals.endProduct.failed++;
              }
            }

            // Add Separator and Summary Columns
            wetWorkRow.innerHTML += `<td class="border-y border-slate-400 separator-cell" rowspan="2"></td>`;

            // Summary for Wet Work
            wetWorkRow.innerHTML += `
                        <td class="border border-slate-400 p-2 bg-slate-50 font-semibold text-slate-700">${floorTotals.wetWork.submitted}</td>
                        <td class="border border-slate-400 p-2 bg-teal-50 font-semibold text-teal-700">${floorTotals.wetWork.passed}</td>
                        <td class="border border-slate-400 p-2 bg-rose-50 font-semibold text-rose-700">${floorTotals.wetWork.failed}</td>
                    `;

            // Summary for End Product
            endProductRow.innerHTML += `
                        <td class="border border-slate-400 p-2 bg-slate-50 font-semibold text-slate-700">${floorTotals.endProduct.submitted}</td>
                        <td class="border border-slate-400 p-2 bg-teal-50 font-semibold text-teal-700">${floorTotals.endProduct.passed}</td>
                        <td class="border border-slate-400 p-2 bg-rose-50 font-semibold text-rose-700">${floorTotals.endProduct.failed}</td>
                    `;

            tbody.appendChild(wetWorkRow);
            tbody.appendChild(endProductRow);

            // Add to grand totals
            totals.wetWork.submitted += floorTotals.wetWork.submitted;
            totals.wetWork.passed += floorTotals.wetWork.passed;
            totals.wetWork.failed += floorTotals.wetWork.failed;
            totals.endProduct.submitted += floorTotals.endProduct.submitted;
            totals.endProduct.passed += floorTotals.endProduct.passed;
            totals.endProduct.failed += floorTotals.endProduct.failed;
          });

          mainTable.appendChild(tbody);

          const tfoot = document.createElement("tfoot");
          tfoot.innerHTML = `
                    <tr class="font-bold bg-slate-200 border-t-2 border-slate-800">
                        <td class="border border-slate-400 p-2 align-middle" rowspan="2"><span>TOTAL</span></td>
                        <td class="border border-slate-400 p-1 font-semibold bg-slate-100 text-slate-600 text-xs align-middle">Wet Work</td>
                        <td class="border border-slate-400" colspan="${CONFIG.MAX_ROOMS}"><span>( ${CONFIG.TOTAL_UNITS} UNIT )</span></td>
                        <td class="border-y border-slate-400 separator-cell" rowspan="2"></td>
                        <td class="border border-slate-400 p-2 bg-slate-100"><span>${totals.wetWork.submitted}</span></td>
                        <td class="border border-slate-400 p-2 bg-teal-100"><span>${totals.wetWork.passed}</span></td>
                        <td class="border border-slate-400 p-2 bg-rose-100"><span>${totals.wetWork.failed}</span></td>
                    </tr>
                    <tr class="font-bold bg-slate-200">
                        <td class="border border-slate-400 p-1 font-semibold bg-slate-100 text-slate-600 text-xs align-middle">End Product</td>
                        <td class="border border-slate-400" colspan="${CONFIG.MAX_ROOMS}"></td>
                        <td class="border border-slate-400 p-2 bg-slate-100"><span>${totals.endProduct.submitted}</span></td>
                        <td class="border border-slate-400 p-2 bg-teal-100"><span>${totals.endProduct.passed}</span></td>
                        <td class="border border-slate-400 p-2 bg-rose-100"><span>${totals.endProduct.failed}</span></td>
                    </tr>
                `;
          mainTable.appendChild(tfoot);
        }

        function renderResidentialTable() {
          const mainTable = document.getElementById("main-table");
          mainTable.innerHTML = "";
          const categoryDef = taskDefinitions[currentCategory];
          const categoryTasks = categoryDef.tasks;
          const isInspection = categoryDef.type === "inspection";
          const isMultiProgress = categoryDef.type === "multi-progress";
          const isDetailedView = isMultiProgress && isDetailedViewActive;

          const { headerColor, subHeaderColor } = getHeaderColors();

          const thead = document.createElement("thead");
          let headerHTML = "";

          if (isDetailedView) {
            headerHTML = `<tr>
                        <th class="border p-2 ${headerColor}" rowspan="2"><span>ชั้น</span></th>
                        <th class="border p-2 ${headerColor}" rowspan="2" style="min-width: 100px;"><span>รายการ</span></th>
                        <th class="border p-2 ${headerColor}" colspan="${CONFIG.MAX_ROOMS}"><span>ROOM No.</span></th>
                        <th class="border-y separator-cell" rowspan="2"></th>
                        <th class="border p-2 ${headerColor}" rowspan="2"><span>จำนวน</span></th>
                        <th class="border p-2 bg-teal-200 text-slate-800" rowspan="2"><span>เสร็จ</span></th>
                        <th class="border p-2 bg-rose-200 text-slate-800" rowspan="2"><span>คงเหลือ</span></th>
                    </tr>
                    <tr>`;
            for (let i = 1; i <= CONFIG.MAX_ROOMS; i++) {
              headerHTML += `<th class="border p-1 md:p-2 font-normal ${subHeaderColor}"><span>${i}</span></th>`;
            }
            headerHTML += "</tr>";
          } else {
            headerHTML = `<tr>
                        <th class="border p-2 ${headerColor}" rowspan="2"><span>ชั้น</span></th>
                        <th class="border p-2 ${headerColor}" colspan="${CONFIG.MAX_ROOMS}"><span>ROOM No.</span></th>
                        <th class="border-y separator-cell" rowspan="2"></th>
                        <th class="border p-2 ${headerColor}" colspan="${isInspection ? 3 : categoryTasks.length}"><span>${isInspection ? "สรุปผลตรวจ" : "จำนวน"}</span></th>
                        <th class="border p-2 bg-teal-200 text-slate-800" rowspan="2"><span>ผ่าน/เสร็จ</span></th>
                        <th class="border p-2 bg-rose-200 text-slate-800" rowspan="2"><span>คงเหลือ</span></th>
                    </tr>
                    <tr>`;
            for (let i = 1; i <= CONFIG.MAX_ROOMS; i++) {
              headerHTML += `<th class="border p-1 md:p-2 font-normal ${subHeaderColor}"><span>${i}</span></th>`;
            }
            if (isInspection) {
              headerHTML += `<th class="border p-2 bg-slate-100 font-semibold"><span>ส่งแล้ว</span></th>`;
              headerHTML += `<th class="border p-2 bg-teal-100 font-semibold"><span>ผ่าน</span></th>`;
              headerHTML += `<th class="border p-2 bg-rose-100 font-semibold"><span>ไม่ผ่าน</span></th>`;
            } else {
              categoryTasks.forEach((task) => {
                const colorName = task.color.split("-")[1];
                headerHTML += `<th class="border p-2 bg-${colorName}-100 text-black font-semibold"><span>${task.name}</span></th>`;
              });
            }
            headerHTML += "</tr>";
          }
          thead.innerHTML = headerHTML;
          mainTable.appendChild(thead);

          const tbody = document.createElement("tbody");
          const totals = isDetailedView
            ? {}
            : Array(isInspection ? 3 : categoryTasks.length).fill(0);
          let totalCompleted = 0;

          CONFIG.FLOORS.forEach((floor) => {
            const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
            if (isDetailedView) {
              const detailedTasks = categoryDef.tasks;
              let floorCompletedCount = 0;
              for (let room = 1; room <= roomsOnThisFloor; room++) {
                const unitData =
                  projectData[currentCategory]?.[floor]?.[room] || {};
                let isRoomComplete = true;
                detailedTasks.forEach((task) => {
                  if (task.condition && !task.condition(floor, room)) return;
                  if ((unitData[`progress_${task.key}`] || 0) < 100)
                    isRoomComplete = false;
                });
                if (isRoomComplete) floorCompletedCount++;
              }
              totalCompleted += floorCompletedCount;

              detailedTasks.forEach((task, taskIndex) => {
                const row = document.createElement("tr");
                if (taskIndex === 0) {
                  row.innerHTML += `<td class="border p-2 font-bold bg-slate-100 align-middle" rowspan="${detailedTasks.length}"><span>${floor}</span></td>`;
                }
                row.innerHTML += `<td class="border p-1 text-left font-semibold bg-slate-50 text-slate-600 text-[11px]">${task.name}</td>`;

                for (let room = 1; room <= CONFIG.MAX_ROOMS; room++) {
                  if (room > CONFIG.getRoomsOnFloor(floor)) {
                    const emptyCell = document.createElement("td");
                    emptyCell.className = "border p-2 bg-slate-200";
                    row.appendChild(emptyCell);
                    continue;
                  }
                  const unitData =
                    projectData[currentCategory]?.[floor]?.[room] || {};
                  if (task.condition && !task.condition(floor, room)) {
                    const naCell = document.createElement("td");
                    naCell.className =
                      "border p-2 bg-slate-100 text-slate-400 text-center text-[10px]";
                    naCell.textContent = "N/A";
                    row.appendChild(naCell);
                    continue;
                  }
                  const progress = unitData[`progress_${task.key}`] || 0;
                  const styleClasses = getProgressColor(progress, task.color);
                  const cell = document.createElement("td");
                  cell.className = `border p-2 table-cell ${styleClasses}`;
                  cell.innerHTML = `<span class="percentage-text">${progress}%</span>`;
                  cell.dataset.floor = floor;
                  cell.dataset.room = room;
                  row.appendChild(cell);
                }

                if (taskIndex === 0) {
                  const separator = document.createElement("td");
                  separator.className = "border-y separator-cell";
                  separator.rowSpan = detailedTasks.length;
                  row.appendChild(separator);
                  let floorTaskCountsHTML =
                    '<div class="flex flex-col p-1 space-y-0.5 text-xs text-left">';
                  detailedTasks.forEach((task, index) => {
                    let startedCount = 0;
                    for (let r = 1; r <= roomsOnThisFloor; r++) {
                      if (
                        (projectData[currentCategory]?.[floor]?.[r]?.[
                          `progress_${task.key}`
                        ] || 0) > 0
                      )
                        startedCount++;
                    }
                    totals[task.key] = (totals[task.key] || 0) + startedCount;
                    const borderClass =
                      index === detailedTasks.length - 1
                        ? ""
                        : "border-b border-slate-200";
                    floorTaskCountsHTML += `<div class="grid grid-cols-2 gap-2 py-1 ${borderClass}"><span>${task.name}:</span><span class="font-semibold text-right">${startedCount}</span></div>`;
                  });
                  floorTaskCountsHTML += "</div>";
                  const topBorderClass =
                    floor === CONFIG.FLOORS[0]
                      ? ""
                      : "border-t-slate-300 border-t-2";

                  const summaryCell = document.createElement("td");
                  summaryCell.className = `border ${topBorderClass} p-0 summary-cell align-top`;
                  summaryCell.rowSpan = detailedTasks.length;
                  summaryCell.innerHTML = floorTaskCountsHTML;
                  row.appendChild(summaryCell);

                  const completedCell = document.createElement("td");
                  completedCell.className = `border ${topBorderClass} p-2 text-green-700 font-semibold summary-cell align-middle`;
                  completedCell.rowSpan = detailedTasks.length;
                  completedCell.innerHTML = `<span>${floorCompletedCount}</span>`;
                  row.appendChild(completedCell);

                  const remainingCell = document.createElement("td");
                  remainingCell.className = `border ${topBorderClass} p-2 text-red-700 font-semibold summary-cell align-middle`;
                  remainingCell.rowSpan = detailedTasks.length;
                  remainingCell.innerHTML = `<span>${roomsOnThisFloor - floorCompletedCount}</span>`;
                  row.appendChild(remainingCell);
                }
                tbody.appendChild(row);
              });
            } else {
              const row = document.createElement("tr");
              const floorCell = document.createElement("td");
              floorCell.className = "border p-2 font-bold bg-slate-100";
              floorCell.innerHTML = `<span>${floor}</span>`;
              row.appendChild(floorCell);

              for (let room = 1; room <= CONFIG.MAX_ROOMS; room++) {
                if (room > CONFIG.getRoomsOnFloor(floor)) {
                  const emptyCell = document.createElement("td");
                  emptyCell.className = "border p-2 bg-slate-200";
                  row.appendChild(emptyCell);
                  continue;
                }
                const unitData =
                  projectData[currentCategory]?.[floor]?.[room] || {};
                let styleClasses, cellText;

                if (isInspection) {
                  if (unitData.inInspection) {
                    styleClasses = "bg-yellow-400 text-black";
                    cellText = "รอคะแนน";
                  } else {
                    let scoreToShow = 0,
                      defectToShow = false,
                      stageLabel = "";
                    if (
                      unitData.qcScore > 0 &&
                      unitData.qcScore === unitData.cmScore
                    ) {
                      scoreToShow = unitData.qcScore;
                      defectToShow = unitData.qcHasMajorDefect;
                      stageLabel = "QC-CM: ";
                    } else if (unitData.qcScore > 0) {
                      scoreToShow = unitData.qcScore;
                      defectToShow = unitData.qcHasMajorDefect;
                      stageLabel = "QC: ";
                    } else if (unitData.cmScore > 0) {
                      scoreToShow = unitData.cmScore;
                      defectToShow = unitData.cmHasMajorDefect;
                      stageLabel = "CM: ";
                    }
                    if (scoreToShow > 0) {
                      styleClasses =
                        scoreToShow >= 85
                          ? "bg-teal-500 text-white"
                          : "bg-rose-500 text-white";
                      cellText = `${stageLabel}${Number.isInteger(scoreToShow) ? scoreToShow : scoreToShow.toFixed(2)}`;
                      if (defectToShow) {
                        cellText += "!";
                        if (showMajorDefectHighlight) {
                          styleClasses += " major-defect-highlight";
                        }
                      }
                    } else {
                      styleClasses = "bg-slate-50 text-slate-400";
                      cellText = "-";
                    }
                  }
                } else if (isMultiProgress) {
                  let totalProgress = 0;
                  let applicableTaskCount = 0;
                  const activeTasks = [];
                  categoryDef.tasks.forEach((task) => {
                    if (task.condition && !task.condition(floor, room)) return;
                    applicableTaskCount++;
                    const progress = unitData[`progress_${task.key}`] || 0;
                    totalProgress += progress;
                    if (progress > 0) activeTasks.push(task.shortName);
                  });
                  const avgProgress =
                    applicableTaskCount > 0
                      ? totalProgress / applicableTaskCount
                      : 0;

                  let categoryBaseColor = "bg-sky-500";
                  const iconDef = categoryIcons[currentCategory];
                  if (iconDef && iconDef.color) {
                      const cName = iconDef.color.split("-")[1];
                      if (cName) categoryBaseColor = `bg-${cName}-500`;
                  }

                  styleClasses =
                    Math.round(avgProgress) >= 100
                      ? "bg-teal-500 text-white"
                      : avgProgress > 0
                        ? getProgressColor(avgProgress, categoryBaseColor)
                        : "bg-white text-black";
                  cellText = `${Math.round(avgProgress)}%`;
                  if (activeTasks.length > 0) {
                    const subText = activeTasks.join(" ");
                    cellText += `<div class="sub-task-name absolute bottom-0 left-0 right-0 text-[8px] opacity-70 flex justify-center">${subText}</div>`;
                  }
                } else {
                  const progress = unitData.progress || 0;
                  const currentTaskIndex = unitData.taskIndex || 0;
                  if (categoryTasks[currentTaskIndex]) {
                    const currentTask = categoryTasks[currentTaskIndex];
                    const isFinalTask =
                      currentTaskIndex === categoryTasks.length - 1;
                    const isCompleted = isFinalTask && progress >= 100;

                    if (isCompleted) {
                      styleClasses = `${currentTask.color} ${currentTask.textColor}`;
                    } else if (progress >= 100 && !isFinalTask) {
                      styleClasses = `${currentTask.color} ${currentTask.textColor}`;
                    } else if (progress > 0) {
                      styleClasses = getProgressColor(
                        progress,
                        currentTask.color,
                      );
                    } else {
                      styleClasses = "bg-white text-black";
                    }

                    cellText = `${progress}%`;
                    if (progress > 0 && !isCompleted) {
                      cellText += `<span class="sub-task-name absolute bottom-0 right-1 text-[8px] opacity-70">${currentTask.name}</span>`;
                    }
                  } else {
                    cellText = "N/A";
                    styleClasses = "bg-gray-200 text-black";
                  }
                }
                const cell = document.createElement("td");
                cell.className = `border p-2 table-cell ${styleClasses}`;
                cell.innerHTML = `<span class="percentage-text">${cellText}</span>`;
                cell.dataset.floor = floor;
                cell.dataset.room = room;
                row.appendChild(cell);
              }

              const separator = document.createElement("td");
              separator.className = "border-y separator-cell";
              row.appendChild(separator);

              let floorCompleted = 0;
              if (isInspection) {
                let floorSubmitted = 0,
                  floorPassed = 0,
                  floorFailed = 0;
                for (let room = 1; room <= roomsOnThisFloor; room++) {
                  const unitData =
                    projectData[currentCategory]?.[floor]?.[room] || {};
                  const hasCmScore = (unitData.cmScore || 0) > 0;
                  const hasQcScore = (unitData.qcScore || 0) > 0;

                  if (hasCmScore || hasQcScore) {
                    floorSubmitted++;
                    const score = hasQcScore
                      ? unitData.qcScore
                      : unitData.cmScore;
                    if (score >= 85) {
                      floorPassed++;
                    } else {
                      floorFailed++;
                    }
                  }
                }
                floorCompleted = floorPassed;

                const submittedCell = document.createElement("td");
                submittedCell.className = "border p-2 summary-cell";
                submittedCell.innerHTML = `<span>${floorSubmitted}</span>`;
                row.appendChild(submittedCell);

                const passedCell = document.createElement("td");
                passedCell.className = "border p-2 summary-cell bg-teal-50";
                passedCell.innerHTML = `<span>${floorPassed}</span>`;
                row.appendChild(passedCell);

                const failedCell = document.createElement("td");
                failedCell.className = "border p-2 summary-cell bg-rose-50";
                failedCell.innerHTML = `<span>${floorFailed}</span>`;
                row.appendChild(failedCell);

                totals[0] += floorSubmitted;
                totals[1] += floorPassed;
                totals[2] += floorFailed;
              } else if (isMultiProgress) {
                const floorCounts = Array(categoryTasks.length).fill(0);
                for (let room = 1; room <= roomsOnThisFloor; room++) {
                  const unitData =
                    projectData[currentCategory]?.[floor]?.[room] || {};
                  let isRoomComplete = true;
                  categoryDef.tasks.forEach((task, index) => {
                    if (task.condition && !task.condition(floor, room)) return;
                    const progress = unitData[`progress_${task.key}`] || 0;
                    if (progress > 0) floorCounts[index]++;
                    if (progress < 100) isRoomComplete = false;
                  });
                  if (isRoomComplete) floorCompleted++;
                }
                floorCounts.forEach((count, i) => {
                  const colorName = categoryTasks[i].color ? categoryTasks[i].color.split("-")[1] : "slate";
                  const bgColor = `bg-${colorName}-50`;
                  const textColor = count > 0 ? `text-${colorName}-700 font-bold` : "";
                  const countCell = document.createElement("td");
                  countCell.className = `border p-2 summary-cell ${bgColor} ${textColor}`;
                  countCell.innerHTML = `<span>${count}</span>`;
                  row.appendChild(countCell);
                  totals[i] += count;
                });
              } else {
                const floorCounts = Array(categoryTasks.length).fill(0);
                for (let room = 1; room <= roomsOnThisFloor; room++) {
                  const unitData =
                    projectData[currentCategory]?.[floor]?.[room] || {};
                  for (let i = 0; i < (unitData.taskIndex || 0); i++)
                    floorCounts[i]++;
                  if (unitData.progress > 0) {
                    const currentTaskIndex = unitData.taskIndex || 0;
                    if (floorCounts[currentTaskIndex] !== undefined) {
                      floorCounts[currentTaskIndex]++;
                    }
                  }
                  if (
                    (unitData.taskIndex || 0) === categoryTasks.length - 1 &&
                    unitData.progress >= 100
                  )
                    floorCompleted++;
                }
                floorCounts.forEach((count, i) => {
                  const colorName = categoryTasks[i].color ? categoryTasks[i].color.split("-")[1] : "slate";
                  const bgColor = `bg-${colorName}-50`;
                  const textColor = count > 0 ? `text-${colorName}-700 font-bold` : "";
                  const countCell = document.createElement("td");
                  countCell.className = `border p-2 summary-cell ${bgColor} ${textColor}`;
                  countCell.innerHTML = `<span>${count}</span>`;
                  row.appendChild(countCell);
                  totals[i] += count;
                });
              }
              const floorRemaining = roomsOnThisFloor - floorCompleted;

              const completedCell = document.createElement("td");
              completedCell.className =
                "border p-2 text-green-700 font-semibold summary-cell";
              completedCell.innerHTML = `<span>${floorCompleted}</span>`;
              row.appendChild(completedCell);

              const remainingCell = document.createElement("td");
              remainingCell.className =
                "border p-2 text-red-700 font-semibold summary-cell";
              remainingCell.innerHTML = `<span>${floorRemaining}</span>`;
              row.appendChild(remainingCell);

              totalCompleted += floorCompleted;
              tbody.appendChild(row);
            }
          });
          mainTable.appendChild(tbody);

          const tfoot = document.createElement("tfoot");
          const totalRemaining = CONFIG.TOTAL_UNITS - totalCompleted;

          const row = document.createElement("tr");
          row.className = "font-bold bg-slate-200";

          const totalCell = document.createElement("td");
          totalCell.className = "border p-2";
          totalCell.colSpan = isDetailedView
            ? CONFIG.MAX_ROOMS + 3
            : CONFIG.MAX_ROOMS + 2;
          totalCell.innerHTML = `<span>TOTAL ( ${CONFIG.TOTAL_UNITS} UNIT )</span>`;
          row.appendChild(totalCell);

          if (isDetailedView) {
            const detailedTasks = categoryDef.tasks;
            const summaryCell = document.createElement("td");
            summaryCell.className = "border p-0 summary-cell align-top";
            let footerTaskCountsHTML =
              '<div class="flex flex-col p-1 space-y-0.5 text-xs text-left">';
            detailedTasks.forEach((task, index) => {
              const total = totals[task.key] || 0;
              const borderClass =
                index === detailedTasks.length - 1
                  ? ""
                  : "border-b border-slate-200";
              footerTaskCountsHTML += `<div class="grid grid-cols-2 gap-2 py-1 ${borderClass}"><span>${task.name}:</span><span class="font-semibold text-right">${total}</span></div>`;
            });
            footerTaskCountsHTML += "</div>";
            summaryCell.innerHTML = footerTaskCountsHTML;
            row.appendChild(summaryCell);
          } else {
            totals.forEach((total, index) => {
              let bgColor = "bg-slate-100";
              let textColor = "";
              if (isInspection) {
                if (index === 1) bgColor = "bg-teal-100";
                if (index === 2) bgColor = "bg-rose-100";
              } else {
                const colorName = categoryTasks[index].color ? categoryTasks[index].color.split("-")[1] : "slate";
                bgColor = `bg-${colorName}-100`;
                textColor = total > 0 ? `text-${colorName}-800 font-bold` : "";
              }
              const cell = document.createElement("td");
              cell.className = `border p-2 ${bgColor} ${textColor}`;
              cell.innerHTML = `<span>${total}</span>`;
              row.appendChild(cell);
            });
          }

          const completedCell = document.createElement("td");
          completedCell.className = "border p-2 bg-teal-100";
          completedCell.innerHTML = `<span>${totalCompleted}</span>`;
          row.appendChild(completedCell);

          const remainingCell = document.createElement("td");
          remainingCell.className = "border p-2 bg-rose-100";
          remainingCell.innerHTML = `<span>${totalRemaining}</span>`;
          row.appendChild(remainingCell);

          tfoot.appendChild(row);

          mainTable.appendChild(tfoot);
        }

        function highlightChanges(oldData, newData) {
          if (currentView === "residential") {
            if (!oldData[currentCategory] || !newData[currentCategory]) return;
            CONFIG.FLOORS.forEach((floor) => {
              const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
              for (let room = 1; room <= roomsOnThisFloor; room++) {
                const oldUnitData = oldData[currentCategory]?.[floor]?.[room];
                const newUnitData = newData[currentCategory]?.[floor]?.[room];
                if (
                  JSON.stringify(oldUnitData) !== JSON.stringify(newUnitData)
                ) {
                  const cell = document.querySelector(
                    `.table-cell[data-floor='${floor}'][data-room='${room}']`,
                  );
                  if (cell) {
                    cell.classList.remove("cell-updated");
                    setTimeout(() => cell.classList.add("cell-updated"), 10);
                  }
                }
              }
            });
          } else if (currentView === "common") {
            if (!oldData.commonArea || !newData.commonArea) return;
            Object.keys(commonAreaDefinitions).forEach((locKey) => {
              const locDef = commonAreaDefinitions[locKey];
              locDef.tasks.forEach((task, taskIndex) => {
                CONFIG.COMMON_AREA_FLOORS.forEach((floor) => {
                  const oldProgress =
                    oldData.commonArea?.[locKey]?.tasks?.[taskIndex]
                      ?.progress?.[floor];
                  const newProgress =
                    newData.commonArea?.[locKey]?.tasks?.[taskIndex]
                      ?.progress?.[floor];
                  if (oldProgress !== newProgress) {
                    const cell = document.querySelector(
                      `.table-cell[data-location-key='${locKey}'][data-task-index='${taskIndex}'][data-floor='${floor}']`,
                    );
                    if (cell) {
                      cell.classList.remove("cell-updated");
                      setTimeout(() => cell.classList.add("cell-updated"), 10);
                    }
                  }
                });
              });
            });
          } else {
            // qcSummary view
            CONFIG.FLOORS.forEach((floor) => {
              const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
              for (let room = 1; room <= roomsOnThisFloor; room++) {
                ["wetWork", "endProduct"].forEach((qcType) => {
                  const oldUnitData = oldData[qcType]?.[floor]?.[room];
                  const newUnitData = newData[qcType]?.[floor]?.[room];
                  if (
                    JSON.stringify(oldUnitData) !== JSON.stringify(newUnitData)
                  ) {
                    const cell = document.querySelector(
                      `.table-cell[data-floor='${floor}'][data-room='${room}'][data-qc-type='${qcType}']`,
                    );
                    if (cell) {
                      cell.classList.remove("cell-updated");
                      setTimeout(() => cell.classList.add("cell-updated"), 10);
                    }
                  }
                });
              }
            });
          }
        }

        function setupCategoryButtons() {
          const container = document.getElementById("task-category-buttons");
          container.innerHTML = "";

          const getIconForTask = (catKey, isSelected) => {
            const iconColor = isSelected
              ? "text-white"
              : {
                  skimAndPaint: "text-blue-500",
                  topping: "text-stone-500",
                  electrical: "text-yellow-500",
                  plumbing: "text-blue-500",
                  airCon: "text-cyan-500",
                  ceiling: "text-sky-500",
                  texcaWall: "text-orange-500",
                  waterproofing: "text-cyan-500",
                  tiling: "text-teal-500",
                  aluminum: "text-slate-500",
                  furniture: "text-amber-600",
                  laminate: "text-yellow-600",
                  door: "text-amber-800",
                  showerScreen: "text-blue-400",
                  wetWork: "text-indigo-500",
                  aluminumPaint: "text-zinc-500",
                  cleaning: "text-violet-500",
                  endProduct: "text-emerald-500",
                }[catKey] || "text-slate-400";

            const icons = {
              skimAndPaint: `<img src="https://img1.pic.in.th/images/paint.md.png" alt="งานสี" class="w-5 h-5 object-contain" />`,
              paintOnly: `<img src="https://img1.pic.in.th/images/paint.md.png" alt="งานสี" class="w-5 h-5 object-contain" />`,
              topping: `<img src="https://img1.pic.in.th/images/Topping.png" alt="งาน Topping" class="w-5 h-5 object-contain" />`,
              electrical: `<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`,
              plumbing: `<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"></path></svg>`,
              airCon: `<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
              ceiling: `<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>`,
              texcaWall: `<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M5 21v-3a2 2 0 012-2h10a2 2 0 012 2v3"></path></svg>`,
              waterproofing: `<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"></path></svg>`,
              tiling: `<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>`,
              aluminum: `<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-width="2"></rect><line x1="3" y1="9" x2="21" y2="9" stroke-width="2"></line><line x1="9" y1="21" x2="9" y2="9" stroke-width="2"></line></svg>`,
              furniture: `<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>`,
              laminate: `<img src="https://img1.pic.in.th/images/Untitled-5822b5d8fb838c5cc.png" alt="Laminate" class="w-5 h-5 object-contain" />`,
              door: `<img src="https://img1.pic.in.th/images/Door.png" alt="งานประตู" class="w-5 h-5 object-contain" />`,
              showerScreen: `<img src="https://img2.pic.in.th/shower-screen.png" alt="Shower Screen" class="w-5 h-5 object-contain" />`,
              wetWork: `<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
              aluminumPaint: `<img src="https://img1.pic.in.th/images/alucolor.png" alt="Aluminum Paint" class="w-5 h-5 object-contain" />`,
              cleaning: `<img src="https://img1.pic.in.th/images/clean10ebd589103179c6.png" alt="Cleaning" class="w-5 h-5 object-contain" />`,
              endProduct: `<img src="https://img1.pic.in.th/images/end.png" alt="End Product" class="w-5 h-5 object-contain" />`,
            };
            return (
              icons[catKey] ||
              `<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>`
            );
          };

          const wetWorkKeys = [
            "skimAndPaint",
            "topping",
            "ceiling",
            "texcaWall",
            "waterproofing",
            "tiling",
            "aluminum",
            "wetWork",
          ];
          const endProductKeys = [
            "furniture",
            "laminate",
            "door",
            "showerScreen",
            "aluminumPaint",
            "cleaning",
            "endProduct",
          ];

          const createGroup = (title, keys, colorClass) => {
            const groupDiv = document.createElement("div");
            groupDiv.className =
              "flex items-center gap-3 bg-slate-50/50 p-2 rounded-[20px] border border-slate-200/60 w-max shadow-sm";

            const label = document.createElement("div");
            label.className = `px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-xl ${colorClass}`;
            label.textContent = title;
            groupDiv.appendChild(label);

            const btnContainer = document.createElement("div");
            btnContainer.className = "flex gap-1.5";

            keys.forEach((catKey) => {
              const btn = document.createElement("button");
              const isSelected = catKey === currentCategory;

              btn.className = `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-slate-800 text-white shadow-md ring-2 ring-slate-800 ring-offset-2 scale-105 z-10"
                  : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/80 shadow-sm hover:border-slate-300"
              }`;

              btn.innerHTML = `
                            ${getIconForTask(catKey, isSelected)}
                            ${taskDefinitions[catKey].name}
                        `;

              btn.onclick = () => {
                currentCategory = catKey;
                setupCategoryButtons(); // Re-render to update active state
                enterAppView(currentView); // Update layout toggles visibility
                renderTable();
              };

              btnContainer.appendChild(btn);
            });

            groupDiv.appendChild(btnContainer);
            return groupDiv;
          };

          container.appendChild(
            createGroup("WETWORK", wetWorkKeys, "bg-blue-100 text-blue-700"),
          );
          container.appendChild(
            createGroup(
              "END PRODUCT",
              endProductKeys,
              "bg-emerald-100 text-emerald-700",
            ),
          );

          const searchInput = document.getElementById("task-search-input");
          if (searchInput && searchInput.value) {
            filterTasks(searchInput.value);
          }
        }

        function updateUI() {
          const isCommonView = currentView === "common";
          const isQCSummaryView = currentView === "qcSummary";
          const categoryDef = taskDefinitions[currentCategory];

          const taskSelectionContainer = document.getElementById(
            "task-selection-container",
          );
          const taskSearchContainer = document.getElementById(
            "task-search-container",
          );
          
          const shouldHideTaskSelection = isCommonView ||
              isQCSummaryView ||
              currentView === "summaryReport" ||
              currentView === "schedule" ||
              currentView === "qcHandover";

          if (taskSelectionContainer) {
            taskSelectionContainer.style.display = shouldHideTaskSelection ? "none" : "block";
          }
          if (taskSearchContainer) {
             taskSearchContainer.style.display = shouldHideTaskSelection ? "none" : "block";
          }

          const legend = document.getElementById("legend");
          if (legend) {
            legend.style.display =
              isCommonView ||
              currentView === "summaryReport" ||
              currentView === "schedule" ||
              currentView === "qcHandover"
                ? "none"
                : "flex";
          }

          const openReportModalBtn =
            document.getElementById("openReportModalBtn");
          if (openReportModalBtn) {
            openReportModalBtn.style.display =
              isCommonView ||
              currentView === "summaryReport" ||
              currentView === "schedule" ||
              currentView === "qcHandover"
                ? "none"
                : "inline-flex";
          }

          const openCommonAreaReportModalBtn = document.getElementById(
            "openCommonAreaReportModalBtn",
          );
          if (openCommonAreaReportModalBtn) {
            openCommonAreaReportModalBtn.style.display = isCommonView
              ? "inline-flex"
              : "none";
          }

          const scheduleFabContainer = document.getElementById("schedule-fab-container");
          if (scheduleFabContainer) {
            if (currentView === "schedule") {
              scheduleFabContainer.classList.remove("hidden");
              scheduleFabContainer.classList.add("flex");
            } else {
              scheduleFabContainer.classList.add("hidden");
              scheduleFabContainer.classList.remove("flex");
            }
          }

          const toggleQCHandoverSettingsBtn = document.getElementById(
            "toggleQCHandoverSettingsBtn",
          );
          if (toggleQCHandoverSettingsBtn) {
            toggleQCHandoverSettingsBtn.classList.toggle(
              "hidden",
              currentView !== "qcHandover",
            );
          }

          let title = "";
          if (isCommonView) {
            title = "STATUS งานพื้นที่ส่วนกลาง";
          } else if (isQCSummaryView) {
            title = "STATUS สรุปผล QC";
          } else if (currentView === "summaryReport") {
            if (summaryReportMode === "wetWork") {
              title = "รายงานสรุป WET WORK";
            } else if (summaryReportMode === "endProduct") {
              title = "รายงานสรุป END PRODUCT";
            }
          } else if (currentView === "schedule") {
            if (globalScheduleFilters.showWetWork && !globalScheduleFilters.showEndProduct) {
              title = "แผนงานโครงการ (WET WORK)";
            } else if (!globalScheduleFilters.showWetWork && globalScheduleFilters.showEndProduct) {
              title = "แผนงานโครงการ (END PRODUCT)";
            } else {
              title = "แผนงานโครงการ (WET WORK & END PRODUCT)";
            }
          } else if (currentView === "qcHandover") {
            title = projectData.qcHandoverSettings?.title || "แผนส่งห้อง QC";
          } else {
            title = categoryDef
              ? categoryDef.title || `STATUS ${categoryDef.name}`
              : "";
          }

          const thaiDate = new Date().toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const thaiDateShort = new Date().toLocaleDateString("th-TH", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
          });

          const header = document.getElementById("main-header");
          if (reportHeaderStyle === "light") {
            header.className =
              "w-full bg-white text-slate-800 p-4 md:p-8 flex flex-col gap-0 mb-0 shadow-sm relative";
            header.innerHTML = `
                        <div class="flex justify-between items-start w-full mb-6">
                            <div class="flex items-center gap-4">
                                <button onclick="backToSplash()" id="home-btn" class="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 shadow-sm flex items-center justify-center text-slate-600" title="กลับสู่หน้าหลัก">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                </button>
                                <div>
                                    <h1 class="text-3xl md:text-5xl font-black text-[#1e3a8a] tracking-tighter leading-none">PYNN NGAMWONGWAN 54</h1>
                                    <p class="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">CONSTRUCTION PROGRESS REPORT</p>
                                </div>
                            </div>
                            <div class="bg-slate-50 border border-slate-200 px-4 py-2 md:px-6 md:py-3 rounded-2xl shadow-sm">
                                <span class="text-xs md:text-sm font-bold text-slate-700">วันที่รายงาน: <span id="update-date">${thaiDateShort}</span></span>
                            </div>
                        </div>
                        <div class="flex flex-col mt-4">
                             <h2 class="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase" id="status-title">${title}</h2>
                        </div>
                        <div class="h-1.5 w-full bg-[#1e3a8a] mt-6"></div>
                    `;
          } else {
            header.className =
              "bg-[#1e3a8a] text-white p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden shadow-md";
            header.innerHTML = `
                        <div id="home-btn-container" class="flex items-center gap-4 z-10 w-full md:w-1/4">
                             <button onclick="backToSplash()" id="home-btn" class="p-2.5 rounded-xl bg-[#0f172a]/40 hover:bg-[#0f172a]/60 transition-all border border-white/10 shadow-sm flex items-center justify-center" title="กลับสู่หน้าหลัก">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                             </button>
                            <h1 class="text-xl md:text-2xl font-black tracking-tighter text-white">PYNN NGAMWONGWAN 54</h1>
                        </div>
                        <div id="header-title-container" class="w-full md:w-1/2 text-center z-10">
                            <p class="text-2xl md:text-4xl font-black tracking-tight text-white drop-shadow-sm" id="status-title">${title}</p>
                        </div>
                        <div id="header-date-container" class="w-full md:w-1/4 text-center md:text-right z-10 flex flex-col items-center md:items-end">
                             <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-xs md:text-sm font-medium text-slate-200">
                                 <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                 <span>UPDATE: <span id="update-date" class="font-bold text-white">${thaiDate}</span></span>
                             </div>
                        </div>
                    `;
          }

          if (!isCommonView) {
            updateLegend();
          }

          if (window.lucide) {
            lucide.createIcons();
          }
        }

        window.toggleMajorDefectHighlight = function () {
          showMajorDefectHighlight = !showMajorDefectHighlight;
          updateLegend();
          renderTable();
        };

        function updateLegend() {
          const legend = document.getElementById("legend");

          // Single line layout
          legend.className =
            "mt-4 p-3 bg-white border border-black shadow-sm rounded-xl flex items-center gap-4 text-sm font-medium text-slate-700 overflow-x-auto";
          legend.innerHTML = "";

          // Label
          const label = document.createElement("div");
          label.className =
            "flex items-center gap-2 text-slate-900 uppercase tracking-wider text-xs font-bold whitespace-nowrap flex-shrink-0";
          label.innerHTML = `
                    <div class="p-1.5 bg-indigo-50 rounded-lg">
                        <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    </div>
                    ขั้นตอน:
                `;
          legend.appendChild(label);

          const content = document.createElement("div");
          content.className = "flex items-center gap-3 flex-nowrap";
          legend.appendChild(content);

          // Helper for standard badges
          const createBadge = (colorClass, text, iconHtml = "") => {
            return `
                        <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-black shadow-sm transition-transform hover:scale-105 flex-shrink-0">
                            ${iconHtml ? iconHtml : `<div class="w-3 h-3 rounded-full ${colorClass} ring-2 ring-slate-50"></div>`}
                            <span class="text-slate-600 font-medium text-xs md:text-sm whitespace-nowrap">${text}</span>
                        </div>
                    `;
          };

          const createToggleBadge = () => {
            const borderClass = showMajorDefectHighlight
              ? "border-yellow-400 ring-2 ring-yellow-400 bg-yellow-50"
              : "border-black";
            return `
                        <button onclick="toggleMajorDefectHighlight()" class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border ${borderClass} shadow-sm transition-transform hover:scale-105 flex-shrink-0 cursor-pointer">
                            <div class="w-4 h-4 flex items-center justify-center rounded-full bg-rose-100 text-rose-600 font-bold text-[10px] border border-rose-200">!</div>
                            <span class="text-slate-600 font-medium text-xs md:text-sm whitespace-nowrap">พบ Major Defect</span>
                        </button>
                    `;
          };

          // Helper for sequential steps
          const createStep = (colorClass, text, number, isLast = false) => {
            return `
                        <div class="flex items-center group flex-shrink-0">
                            <div class="flex items-center gap-2 bg-white pl-2 pr-3 py-1.5 rounded-full border border-black shadow-sm transition-all hover:shadow-md hover:border-indigo-100">
                                <div class="w-5 h-5 rounded-full ${colorClass} flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white legend-number-circle">
                                    ${number}
                                </div>
                                <span class="text-slate-700 font-medium text-xs md:text-sm whitespace-nowrap">${text}</span>
                            </div>
                            ${
                              !isLast
                                ? `
                                <div class="mx-2 text-black group-hover:text-indigo-300 transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                                </div>
                            `
                                : ""
                            }
                        </div>
                    `;
          };

          // Logic to populate content
          if (currentView === "qcSummary") {
            content.innerHTML += createBadge("bg-yellow-400", "รอคะแนน");
            content.innerHTML += createBadge("bg-teal-500", "ผ่าน (>= 85)");
            content.innerHTML += createBadge("bg-rose-500", "ไม่ผ่าน (< 85)");
            content.innerHTML += createToggleBadge();
            return;
          }

          const categoryDef = taskDefinitions[currentCategory];
          if (!categoryDef) return;

          if (categoryDef.type === "inspection") {
            content.innerHTML += createBadge("bg-yellow-400", "รอคะแนน");
            content.innerHTML += createBadge("bg-teal-500", "ผ่าน (>= 85)");
            content.innerHTML += createBadge("bg-rose-500", "ไม่ผ่าน (< 85)");
            content.innerHTML += createToggleBadge();
          } else if (categoryDef.type === "multi-progress") {
            content.innerHTML += createBadge(
              "bg-sky-200",
              "เริ่มดำเนินการ (1-30%)",
            );
            content.innerHTML += createBadge("bg-sky-400", "คืบหน้า (31-60%)");
            content.innerHTML += createBadge(
              "bg-sky-500",
              "คืบหน้ามาก (61-99%)",
            );
            content.innerHTML += createBadge(
              "bg-emerald-500",
              "เสร็จสมบูรณ์ (100%)",
            );
          } else {
            // Sequential flow
            categoryDef.tasks.forEach((task, index) => {
              content.innerHTML += createStep(task.color, task.name, index + 1);
            });
            content.innerHTML += createStep(
              "bg-emerald-500",
              "เสร็จสมบูรณ์",
              categoryDef.tasks.length + 1,
              true,
            );
          }
        }

        function trapFocus(e) {
          if (!activeModal || e.key !== "Tab") return;

          const focusableElements = activeModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          const firstFocusableElement = focusableElements[0];
          const lastFocusableElement =
            focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusableElement) {
              lastFocusableElement.focus();
              e.preventDefault();
            }
          } else {
            // Tab
            if (document.activeElement === lastFocusableElement) {
              firstFocusableElement.focus();
              e.preventDefault();
            }
          }
        }

        window.openModal = openModal;
        function openModal(modalId, triggerElement = document.activeElement) {
          const modal = document.getElementById(modalId);
          if (!modal) return;

          lastFocusedElement = triggerElement;
          activeModal = modal;

          modal.style.display = "flex";
          document.body.classList.add("modal-open");

          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }

          modal.addEventListener("keydown", trapFocus);
        }

        window.closeModal = closeModal;
        function closeModal(modalId) {
          const modal = document.getElementById(modalId);
          if (!modal) return;

          modal.style.display = "none";
          document.body.classList.remove("modal-open");

          modal.removeEventListener("keydown", trapFocus);
          activeModal = null;

          if (lastFocusedElement) {
            lastFocusedElement.focus();
          }

          if (modalId === "updateModal" || modalId === "summaryPlanModal")
            clearSelection();
        }

        let currentSummaryPlanData = { floor: null, room: null, taskKey: null };

        function getTaskName(key) {
          if (key === "texcaWallOnly") return "TEXCA";
          if (key === "ceilingRoomFraming") return "โครงฝ้า(พัก)";
          if (key === "ceilingBathroomFraming") return "โครงฝ้า(น้ำ)";
          if (key === "ceilingBoard") return "ปิดแผ่น";
          if (key === "above_ceiling_inspection") return "ตรวจเหนือฝ้า";
          if (key === "skimAndPaintCombined") return "งานสกิมทาสี";
          if (key === "kitchenOnly") return "งานติดตั้งชุดครัว";
          if (key === "paintOnly") return "งานสี";
          if (key === "skimOnly") return "งานสกิม";
          if (key === "showerScreenInspection") return "ตรวจรับพื้นที่(Shower)";
          return (
            taskDefinitions[key]?.reportName ||
            taskDefinitions[key]?.name ||
            key
          );
        }

        async function saveProjectDataToDB() {
          try {
            // Sync schedule data to projectData before saving
            projectData.globalScheduleData = globalScheduleData;
            projectData.globalScheduleTasks = globalScheduleTasks;
            projectData.globalScheduleSettings = globalScheduleSettings;
            projectData.globalScheduleFilters = globalScheduleFilters;

            const { error } = await supabaseClient
              .from(CONFIG.DB_TABLE_NAME)
              .update({ data: projectData })
              .eq("id", CONFIG.DB_ROW_ID);
            if (error) throw error;

            renderTable();
          } catch (error) {
            console.error("Error saving data to Supabase: ", error);
            showNotificationModal("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
          }
        }

        function openSummaryPlanModal(floor, room, taskKey) {
          let isMultiSelect = false;

          if (!floor || !room || !taskKey) {
            if (selectedCells.size === 0) return;
            isMultiSelect = selectedCells.size > 1;
            const firstCell = selectedCells.values().next().value;
            floor = firstCell.dataset.floor;
            room = firstCell.dataset.room;
            taskKey = firstCell.dataset.taskkey;
          }

          currentSummaryPlanData = { floor, room, taskKey, isMultiSelect };

          let planData = projectData.plans?.[floor]?.[room]?.[taskKey] || {};

          if (typeof planData === "string") {
            planData = {
              currentPlanDate: planData,
              firstPlanDate: planData,
              history: [{ date: planData, timestamp: Date.now() }],
            };
            if (!projectData.plans) projectData.plans = {};
            if (!projectData.plans[floor]) projectData.plans[floor] = {};
            if (!projectData.plans[floor][room])
              projectData.plans[floor][room] = {};
            projectData.plans[floor][room][taskKey] = planData;
            saveProjectDataToDB();
          }

          const dateInput = document.getElementById("summaryPlanDateInput");
          const completedCheckbox = document.getElementById(
            "summaryPlanCompletedCheckbox",
          );
          const progressSlider = document.getElementById(
            "summaryPlanProgressSlider",
          );
          const progressValue = document.getElementById(
            "summaryPlanProgressValue",
          );
          const noteInput = document.getElementById("summaryPlanNoteInput");

          dateInput.value = "";
          noteInput.value = isMultiSelect ? "" : (planData.note || "");

          let category = taskDefinitions[taskKey]
            ? taskKey
            : taskKey === "paintOnly"
              ? "paintOnly"
              : taskKey === "skimOnly"
                ? "skimOnly"
                : taskKey === "skimAndPaintCombined"
                  ? "skimAndPaintCombined"
                  : taskKey === "above_ceiling_inspection"
                    ? "above_ceiling_inspection"
                    : taskKey === "kitchenOnly"
                      ? "kitchenOnly"
                      : taskKey === "ceilingBoard"
                        ? "ceilingBoard"
                        : taskKey === "ceilingRoomFraming"
                          ? "ceilingRoomFraming"
                          : taskKey === "ceilingBathroomFraming"
                            ? "ceilingBathroomFraming"
                            : null;

          let progress = 0;
          let isInspection = false;
          const subTasksContainer = document.getElementById(
            "summaryPlanSubTasksContainer",
          );
          const subTasksList = document.getElementById(
            "summaryPlanSubTasksList",
          );
          const progressContainer = document.getElementById(
            "summaryPlanProgressContainer",
          );
          const historyContainer = document.getElementById(
            "summaryPlanHistoryContainer",
          );
          const multiSelectNotice = document.getElementById("summaryPlanMultiSelectNotice");
          const multiSelectNoticeText = document.getElementById("summaryPlanMultiSelectNoticeText");
          const clearNoteBtn = document.getElementById("clearSummaryPlanNoteBtn");

          subTasksList.innerHTML = "";
          subTasksContainer.classList.add("hidden");
          progressContainer.classList.remove("hidden");

          const modalTitle = document.getElementById("summaryPlanModalTitle");
          if (isMultiSelect) {
            const allSameTask = Array.from(selectedCells).every(
              (c) => c.dataset.taskkey === taskKey,
            );
            const taskName = allSameTask ? getTaskName(taskKey) : "หลายงาน";
            modalTitle.textContent = `อัพเดทแผนงาน`;
            multiSelectNoticeText.textContent = `กำลังอัพเดท ${taskName} พร้อมกัน ${selectedCells.size} รายการ`;
            multiSelectNotice.classList.remove("hidden");
            historyContainer.classList.add("hidden");
            clearNoteBtn.classList.remove("hidden");

            // Reset progress for bulk update
            progressSlider.value = 0;
            progressValue.textContent = 0;
            completedCheckbox.checked = false;
          } else {
            modalTitle.textContent = `อัพเดทแผนงาน`;
            multiSelectNotice.classList.add("hidden");
            historyContainer.classList.remove("hidden");
            clearNoteBtn.classList.remove("hidden"); // Optional for single item, but let's keep it
          }

          if (category && !isMultiSelect) {
            if (category === "paintOnly") {
              const unitData =
                projectData["skimAndPaint"]?.[floor]?.[room] || {};
              if (unitData.taskIndex === 1) {
                progress = unitData.progress || 0;
              } else {
                progress = 0;
              }
            } else if (category === "skimOnly") {
              const unitData =
                projectData["skimAndPaint"]?.[floor]?.[room] || {};
              if (unitData.taskIndex === 0) {
                progress = unitData.progress || 0;
              } else if (unitData.taskIndex > 0) {
                progress = 100;
              } else {
                progress = 0;
              }
            } else if (category === "skimAndPaintCombined") {
              const unitData = projectData["skimAndPaint"]?.[floor]?.[room] || {};
              if (unitData.taskIndex === 1) {
                progress = 50 + ((unitData.progress || 0) / 2);
              } else {
                progress = (unitData.progress || 0) / 2;
              }
            } else if (category === "above_ceiling_inspection") {
              const unitData = projectData["ceiling"]?.[floor]?.[room] || {};
              progress = unitData["progress_above_ceiling_inspection"] || 0;
            } else if (category === "ceilingBoard") {
              const unitData = projectData["ceiling"]?.[floor]?.[room] || {};
              const roomBoard = unitData["progress_room_board"] || 0;
              const bathBoard = unitData["progress_bathroom_board"] || 0;
              progress = (roomBoard + bathBoard) / 2;
            } else if (category === "ceilingRoomFraming") {
              const unitData = projectData["ceiling"]?.[floor]?.[room] || {};
              progress = unitData["progress_room_framing"] || 0;
            } else if (category === "ceilingBathroomFraming") {
              const unitData = projectData["ceiling"]?.[floor]?.[room] || {};
              progress = unitData["progress_bathroom_framing"] || 0;
            } else if (category === "kitchenOnly") {
              const unitData = projectData["furniture"]?.[floor]?.[room] || {};
              if (unitData.taskIndex === 0) {
                progress = unitData.progress || 0;
              } else if (unitData.taskIndex > 0) {
                progress = 100;
              } else {
                progress = 0;
              }
            } else {
              const unitData = projectData[category]?.[floor]?.[room] || {};
              if (taskDefinitions[category].type === "progress") {
                progress = unitData.progress || 0;
              } else if (taskDefinitions[category].type === "multi-progress") {
                const subTasks = taskDefinitions[category].tasks || [];
                const totalProgress = subTasks.reduce(
                  (sum, st) => sum + (unitData[`progress_${st.key}`] || 0),
                  0,
                );
                progress =
                  subTasks.length > 0 ? totalProgress / subTasks.length : 0;

                // Show subtasks
                subTasksContainer.classList.remove("hidden");
                progressContainer.classList.add("hidden");
                subTasks.forEach((st) => {
                  const stProgress = unitData[`progress_${st.key}`] || 0;
                  subTasksList.innerHTML += `
                                    <div>
                                        <div class="flex justify-between text-xs mb-1">
                                            <span class="font-medium text-slate-700">${st.name}</span>
                                            <span class="text-indigo-600 font-bold">${stProgress}%</span>
                                        </div>
                                        <input type="range" data-key="${st.key}" min="0" max="100" value="${stProgress}" class="subtask-slider w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                                    </div>
                                `;
                });
              } else if (taskDefinitions[category].type === "inspection") {
                isInspection = true;
                const score =
                  unitData.qcScore > 0
                    ? unitData.qcScore
                    : unitData.cmScore || 0;
                progress = score >= 85 ? 100 : 0;
              }
            }
          }

          if (isInspection) {
            progressContainer.classList.add("hidden");
          } else {
            // progressContainer already handled for multi-progress
          }

          progressSlider.value = progress;
          progressValue.textContent = Math.round(progress);
          completedCheckbox.checked = progress >= 100;

          // Add event listeners for subtask sliders
          document.querySelectorAll(".subtask-slider").forEach((slider) => {
            slider.oninput = (e) => {
              const val = e.target.value;
              e.target.previousElementSibling.querySelector(
                "span:last-child",
              ).textContent = val + "%";
            };
          });

          progressSlider.oninput = (e) => {
            const val = parseInt(e.target.value, 10);
            progressValue.textContent = val;
            completedCheckbox.checked = val >= 100;
          };

          completedCheckbox.onchange = (e) => {
            if (e.target.checked) {
              progressSlider.value = 100;
              progressValue.textContent = 100;
            } else if (parseInt(progressSlider.value, 10) >= 100) {
              progressSlider.value = 99;
              progressValue.textContent = 99;
            }
          };

          renderSummaryPlanHistory();
          updateSummaryPlanDelayInfo();
          openModal("summaryPlanModal");
        }
        window.openSummaryPlanModal = openSummaryPlanModal;

        function renderSummaryPlanHistory() {
          const { floor, room, taskKey } = currentSummaryPlanData;
          const historyList = document.getElementById("summaryPlanHistoryList");
          historyList.innerHTML = "";

          let planData = projectData.plans?.[floor]?.[room]?.[taskKey] || {};
          const history = planData.history || [];

          if (history.length === 0) {
            historyList.innerHTML =
              '<div class="text-sm text-slate-400 italic">ยังไม่มีประวัติการอัพเดท</div>';
            return;
          }

          // Sort history by timestamp descending (newest first)
          const sortedHistory = [...history].sort(
            (a, b) => b.timestamp - a.timestamp,
          );

          sortedHistory.forEach((item, index) => {
            const dateObj = new Date(item.date);
            const formattedDate = dateObj.toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const isLatest = index === 0;

            const div = document.createElement("div");
            div.className = `flex justify-between items-center p-2 rounded-lg border ${isLatest ? "bg-indigo-50 border-indigo-100" : "bg-white border-slate-100"}`;

            div.innerHTML = `
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium ${isLatest ? "text-indigo-700" : "text-slate-600"}">${formattedDate}</span>
                            ${isLatest ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-600">ล่าสุด</span>' : ""}
                        </div>
                        <button type="button" class="text-rose-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors" onclick="deleteSummaryPlanDate(${item.timestamp})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    `;
            historyList.appendChild(div);
          });
        }

        window.clearSummaryPlanHistory = function () {
          if (!currentSummaryPlanData) return;
          const { floor, room, taskKey } = currentSummaryPlanData;

          showConfirmModal(
            "ยืนยันการล้างประวัติ",
            "คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติแผนงานทั้งหมดของรายการนี้?",
            async () => {
              if (projectData.plans?.[floor]?.[room]?.[taskKey]) {
                delete projectData.plans[floor][room][taskKey];
                await saveProjectDataToDB();
                renderSummaryPlanHistory();
                renderTable();
              }
            },
          );
        };

        window.clearSummaryPlanDate = function () {
          if (!currentSummaryPlanData) return;

          const isMulti = currentSummaryPlanData.isMultiSelect;
          const msg = isMulti
            ? "คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลวันที่ของทุกรายการที่เลือก?"
            : "คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลวันที่ของรายการนี้?";

          showConfirmModal("ยืนยันการล้างวันที่", msg, async () => {
            const cellsToUpdate = isMulti
              ? Array.from(selectedCells)
              : [
                  {
                    dataset: {
                      floor: currentSummaryPlanData.floor,
                      room: currentSummaryPlanData.room,
                      taskkey: currentSummaryPlanData.taskKey,
                    },
                  },
                ];

            cellsToUpdate.forEach((cell) => {
              const floor = cell.dataset.floor;
              const room = cell.dataset.room;
              const taskKey = cell.dataset.taskkey;

              if (projectData.plans?.[floor]?.[room]?.[taskKey]) {
                projectData.plans[floor][room][taskKey].history = [];
                projectData.plans[floor][room][taskKey].firstPlanDate = "";
                projectData.plans[floor][room][taskKey].currentPlanDate = "";
              }
            });

            document.getElementById("summaryPlanDateInput").value = "";
            await saveProjectDataToDB();
            renderSummaryPlanHistory();
            updateSummaryPlanDelayInfo();
            renderTable();
          });
        };

        window.deleteSummaryPlanDate = function (timestamp) {
          const { floor, room, taskKey } = currentSummaryPlanData;
          if (
            !projectData.plans ||
            !projectData.plans[floor] ||
            !projectData.plans[floor][room]
          )
            return;

          let planData = projectData.plans[floor][room][taskKey];
          if (!planData || !planData.history) return;

          planData.history = planData.history.filter(
            (h) => h.timestamp !== timestamp,
          );

          // Recalculate first and current
          if (planData.history.length > 0) {
            // Sort ascending to find first and last
            const sorted = [...planData.history].sort(
              (a, b) => a.timestamp - b.timestamp,
            );
            planData.firstPlanDate = sorted[0].date;
            planData.currentPlanDate = sorted[sorted.length - 1].date;
          } else {
            planData.firstPlanDate = "";
            planData.currentPlanDate = "";
          }

          saveProjectDataToDB(); // save to db
          renderSummaryPlanHistory();
          updateSummaryPlanDelayInfo();
          renderTable(); // update the background table
        };

        window.clearSummaryPlanNote = function () {
          if (!currentSummaryPlanData) return;

          const isMulti = currentSummaryPlanData.isMultiSelect;
          const msg = isMulti
            ? "คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลโน๊ตของทุกรายการที่เลือก?"
            : "คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลโน๊ตของรายการนี้?";

          showConfirmModal("ยืนยันการล้างโน๊ต", msg, async () => {
            const cellsToUpdate = isMulti
              ? Array.from(selectedCells)
              : [
                  {
                    dataset: {
                      floor: currentSummaryPlanData.floor,
                      room: currentSummaryPlanData.room,
                      taskkey: currentSummaryPlanData.taskKey,
                    },
                  },
                ];

            cellsToUpdate.forEach((cell) => {
              const floor = cell.dataset.floor;
              const room = cell.dataset.room;
              const taskKey = cell.dataset.taskkey;

              if (projectData.plans?.[floor]?.[room]?.[taskKey]) {
                projectData.plans[floor][room][taskKey].note = "";
              }
            });

            document.getElementById("summaryPlanNoteInput").value = "";
            await saveProjectDataToDB();
            renderTable();
          });
        };

        function updateSummaryPlanDelayInfo() {
          const dateInput = document.getElementById("summaryPlanDateInput");
          const delayInfo = document.getElementById("summaryPlanDelayInfo");
          const { floor, room, taskKey, isMultiSelect } =
            currentSummaryPlanData;

          if (isMultiSelect) {
            delayInfo.classList.add("hidden");
            return;
          }

          let planData = projectData.plans?.[floor]?.[room]?.[taskKey] || {};

          const newDateStr = dateInput.value || planData.currentPlanDate;
          const firstDateStr = planData.firstPlanDate;

          if (newDateStr && firstDateStr) {
            const newDate = new Date(newDateStr);
            const firstDate = new Date(firstDateStr);
            const diffTime = newDate - firstDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
              delayInfo.textContent = `เลื่อนจากกำหนดเดิม ${diffDays} วัน`;
              delayInfo.classList.remove("hidden");
            } else {
              delayInfo.classList.add("hidden");
            }
          } else {
            delayInfo.classList.add("hidden");
          }
        }

        async function saveSummaryPlan() {
          const dateInput = document.getElementById("summaryPlanDateInput");
          const completedCheckbox = document.getElementById(
            "summaryPlanCompletedCheckbox",
          );
          const progressSlider = document.getElementById(
            "summaryPlanProgressSlider",
          );
          const noteInput = document.getElementById("summaryPlanNoteInput");

          const newDateStr = dateInput.value;
          const isCompleted = completedCheckbox.checked;
          const noteText = noteInput.value.trim();
          let newProgress = parseInt(progressSlider.value, 10);
          if (isCompleted) newProgress = 100;

          const cellsToUpdate = currentSummaryPlanData.isMultiSelect
            ? Array.from(selectedCells)
            : [
                {
                  dataset: {
                    floor: currentSummaryPlanData.floor,
                    room: currentSummaryPlanData.room,
                    taskkey: currentSummaryPlanData.taskKey,
                  },
                },
              ];

          cellsToUpdate.forEach((cell) => {
            const floor = cell.dataset.floor;
            const room = cell.dataset.room;
            const taskKey = cell.dataset.taskkey;

            if (!floor || !room || !taskKey) return;

            // Ensure plans object exists
            if (!projectData.plans) projectData.plans = {};
            if (!projectData.plans[floor]) projectData.plans[floor] = {};
            if (!projectData.plans[floor][room])
              projectData.plans[floor][room] = {};

            let planData = projectData.plans[floor][room][taskKey];
            if (!planData) {
              planData = { history: [] };
            } else if (!planData.history) {
              planData.history = [];
              if (
                planData.firstPlanDate &&
                planData.firstPlanDate !== planData.currentPlanDate
              ) {
                planData.history.push({
                  date: planData.firstPlanDate,
                  timestamp: Date.now() - 2000,
                });
              }
              if (planData.currentPlanDate) {
                planData.history.push({
                  date: planData.currentPlanDate,
                  timestamp: Date.now() - 1000,
                });
              }
            }

            // Update Plan Date
            if (newDateStr) {
              planData.history.push({
                date: newDateStr,
                timestamp: Date.now(),
              });

              const sorted = [...planData.history].sort(
                (a, b) => a.timestamp - b.timestamp,
              );
              planData.firstPlanDate = sorted[0].date;
              planData.currentPlanDate = sorted[sorted.length - 1].date;
            }

            // Update Note: Only overwrite in multi-select if user typed something new
            if (!currentSummaryPlanData.isMultiSelect || noteText !== "") {
              planData.note = noteText;
            }

            projectData.plans[floor][room][taskKey] = planData;

            // Update Progress
            // For multi-select, we apply progress if it's marked as completed or if progress > 0
            if (
              !currentSummaryPlanData.isMultiSelect ||
              isCompleted ||
              newProgress > 0
            ) {
              let category = taskDefinitions[taskKey]
                ? taskKey
                : taskKey === "paintOnly"
                  ? "paintOnly"
                  : taskKey === "skimOnly"
                    ? "skimOnly"
                    : taskKey === "skimAndPaintCombined"
                      ? "skimAndPaintCombined"
                      : taskKey === "above_ceiling_inspection"
                        ? "above_ceiling_inspection"
                        : taskKey === "kitchenOnly"
                          ? "kitchenOnly"
                          : taskKey === "ceilingBoard"
                            ? "ceilingBoard"
                            : taskKey === "ceilingRoomFraming"
                              ? "ceilingRoomFraming"
                              : taskKey === "ceilingBathroomFraming"
                                ? "ceilingBathroomFraming"
                                : null;
              if (category) {
                if (category === "paintOnly") {
                  if (!projectData["skimAndPaint"])
                    projectData["skimAndPaint"] = {};
                  if (!projectData["skimAndPaint"][floor])
                    projectData["skimAndPaint"][floor] = {};
                  if (!projectData["skimAndPaint"][floor][room])
                    projectData["skimAndPaint"][floor][room] = {};

                  const unitData = projectData["skimAndPaint"][floor][room];
                  unitData.taskIndex = 1; // "ทาสี"
                  unitData.progress = newProgress;
                } else if (category === "skimOnly") {
                  if (!projectData["skimAndPaint"])
                    projectData["skimAndPaint"] = {};
                  if (!projectData["skimAndPaint"][floor])
                    projectData["skimAndPaint"][floor] = {};
                  if (!projectData["skimAndPaint"][floor][room])
                    projectData["skimAndPaint"][floor][room] = {};

                  const unitData = projectData["skimAndPaint"][floor][room];
                  if (newProgress >= 100) {
                    if (unitData.taskIndex !== 1) {
                      unitData.taskIndex = 1; // Move to next task
                      unitData.progress = 0; // Reset progress for next task
                    }
                  } else {
                    unitData.taskIndex = 0; // "สกิม"
                    unitData.progress = newProgress;
                  }
                } else if (category === "skimAndPaintCombined") {
                  if (!projectData["skimAndPaint"]) projectData["skimAndPaint"] = {};
                  if (!projectData["skimAndPaint"][floor]) projectData["skimAndPaint"][floor] = {};
                  if (!projectData["skimAndPaint"][floor][room]) projectData["skimAndPaint"][floor][room] = {};
                  
                  const unitData = projectData["skimAndPaint"][floor][room];
                  // newProgress is 0-100 total
                  // 0-50 mapped to skim (0-100)
                  // 50-100 mapped to paint (0-100)
                  if (newProgress > 50) {
                    unitData.taskIndex = 1;
                    unitData.progress = (newProgress - 50) * 2;
                  } else {
                    unitData.taskIndex = 0;
                    unitData.progress = newProgress * 2;
                  }
                } else if (category === "above_ceiling_inspection") {
                  if (!projectData["ceiling"]) projectData["ceiling"] = {};
                  if (!projectData["ceiling"][floor]) projectData["ceiling"][floor] = {};
                  if (!projectData["ceiling"][floor][room]) projectData["ceiling"][floor][room] = {};
                  projectData["ceiling"][floor][room].progress_above_ceiling_inspection = newProgress;
                } else if (category === "ceilingBoard") {
                  if (!projectData["ceiling"]) projectData["ceiling"] = {};
                  if (!projectData["ceiling"][floor]) projectData["ceiling"][floor] = {};
                  if (!projectData["ceiling"][floor][room]) projectData["ceiling"][floor][room] = {};
                  projectData["ceiling"][floor][room].progress_room_board = newProgress;
                  projectData["ceiling"][floor][room].progress_bathroom_board = newProgress;
                } else if (category === "ceilingRoomFraming") {
                  if (!projectData["ceiling"]) projectData["ceiling"] = {};
                  if (!projectData["ceiling"][floor]) projectData["ceiling"][floor] = {};
                  if (!projectData["ceiling"][floor][room]) projectData["ceiling"][floor][room] = {};
                  projectData["ceiling"][floor][room].progress_room_framing = newProgress;
                } else if (category === "ceilingBathroomFraming") {
                  if (!projectData["ceiling"]) projectData["ceiling"] = {};
                  if (!projectData["ceiling"][floor]) projectData["ceiling"][floor] = {};
                  if (!projectData["ceiling"][floor][room]) projectData["ceiling"][floor][room] = {};
                  projectData["ceiling"][floor][room].progress_bathroom_framing = newProgress;
                } else if (category === "kitchenOnly") {
                  if (!projectData["furniture"]) projectData["furniture"] = {};
                  if (!projectData["furniture"][floor])
                    projectData["furniture"][floor] = {};
                  if (!projectData["furniture"][floor][room])
                    projectData["furniture"][floor][room] = {};

                  const unitData = projectData["furniture"][floor][room];
                  if (newProgress >= 100) {
                    if (unitData.taskIndex !== 1) {
                      unitData.taskIndex = 1; // Move to next task
                      unitData.progress = 0; // Reset progress for next task
                    }
                  } else {
                    unitData.taskIndex = 0; // "ติดตั้งชุดครัว"
                    unitData.progress = newProgress;
                  }
                } else {
                  if (!projectData[category]) projectData[category] = {};
                  if (!projectData[category][floor])
                    projectData[category][floor] = {};
                  if (!projectData[category][floor][room])
                    projectData[category][floor][room] = {};

                  const unitData = projectData[category][floor][room];

                  if (taskDefinitions[category].type === "multi-progress") {
                    if (isCompleted) {
                      const subTasks = taskDefinitions[category].tasks || [];
                      subTasks.forEach((st) => {
                        unitData[`progress_${st.key}`] = 100;
                      });
                    } else {
                      document
                        .querySelectorAll(".subtask-slider")
                        .forEach((slider) => {
                          unitData[`progress_${slider.dataset.key}`] = parseInt(
                            slider.value,
                            10,
                          );
                        });
                    }
                  } else if (taskDefinitions[category].type === "progress") {
                    unitData.progress = newProgress;
                    if (newProgress >= 100) {
                      unitData.taskIndex =
                        (taskDefinitions[category].tasks || []).length - 1;
                    } else if (newProgress === 0) {
                      unitData.taskIndex = 0;
                    } else {
                      unitData.taskIndex = Math.max(
                        0,
                        Math.min(
                          unitData.taskIndex || 0,
                          (taskDefinitions[category].tasks || []).length - 1,
                        ),
                      );
                    }
                  }
                }
              }
            }
          });

          try {
            const { error } = await supabaseClient
              .from(CONFIG.DB_TABLE_NAME)
              .update({ data: projectData })
              .eq("id", CONFIG.DB_ROW_ID);
            if (error) throw error;

            renderTable();
            showToast("บันทึกแผนงานสำเร็จ");
          } catch (error) {
            console.error("Error saving summary plan to Supabase: ", error);
            showNotificationModal(
              "เกิดข้อผิดพลาด",
              "ไม่สามารถบันทึกแผนงานได้ กรุณาลองใหม่อีกครั้ง",
            );
          }

          closeModal("summaryPlanModal");
          renderTable();
        }

        function openUpdateModal(cell) {
          if (currentView === "residential" || currentView === "qcSummary") {
            openResidentialUpdateModal();
          } else if (currentView === "summaryReport") {
            openSummaryPlanModal();
          } else {
            openCommonAreaUpdateModal(cell);
          }
        }

        function openCommonAreaUpdateModal(cell) {
          const { locationKey, taskIndex, floor } = cell.dataset;
          const locDef = commonAreaDefinitions[locationKey];
          const taskDef = locDef.tasks[taskIndex];
          const progress =
            projectData.commonArea?.[locationKey]?.tasks?.[taskIndex]
              ?.progress?.[floor] || 0;

          document.getElementById("modal-title").textContent =
            `อัพเดท: ${locDef.locationName}`;
          document.getElementById("modal-description").innerHTML =
            `งาน: <span class="font-semibold">${taskDef.taskName}</span><br>ชั้น: <span class="font-semibold">${floor}</span>`;

          document
            .getElementById("modal-inspection-view")
            .classList.add("hidden");
          document
            .getElementById("modal-multi-progress-view")
            .classList.add("hidden");

          const progressView = document.getElementById("modal-progress-view");
          progressView.classList.remove("hidden");
          document.getElementById("modal-task-select-container").style.display =
            "none";
          document.getElementById("progress-input").value = progress;

          openModal("updateModal");
        }

        function openResidentialUpdateModal() {
          if (selectedCells.size === 0) return;
          const firstCell = selectedCells.values().next().value;
          const { floor, room } = firstCell.dataset;
          const unitData = projectData[currentCategory]?.[floor]?.[room] || {};
          const categoryDef = taskDefinitions[currentCategory];

          document.getElementById("modal-title").textContent =
            selectedCells.size > 1
              ? `อัพเดทสถานะ (${selectedCells.size} ห้อง)`
              : "อัพเดทสถานะ";
          document.getElementById("modal-description").innerHTML =
            `ห้อง: <span id="modal-room-id" class="font-semibold">${selectedCells.size > 1 ? "ห้องที่เลือก" : `${floor} / ${room}`}</span>`;

          document
            .getElementById("modal-progress-view")
            .classList.add("hidden");
          document
            .getElementById("modal-inspection-view")
            .classList.add("hidden");
          document
            .getElementById("modal-multi-progress-view")
            .classList.add("hidden");
          document.getElementById("modal-task-select-container").style.display =
            "block";

          if (categoryDef.type === "inspection") {
            document
              .getElementById("modal-inspection-view")
              .classList.remove("hidden");
            const inInspectionCheckbox = document.getElementById(
              "in-inspection-checkbox",
            );
            const stageSelect = document.getElementById(
              "inspection-stage-select",
            );
            const scoreInput = document.getElementById("score-input");
            const defectCheckbox = document.getElementById(
              "major-defect-checkbox",
            );
            const isMultiSelect = selectedCells.size > 1;

            const toggleInspectionFields = () => {
              const isDisabled = inInspectionCheckbox.checked;
              stageSelect.disabled = isDisabled;
              scoreInput.disabled = isDisabled;
              defectCheckbox.disabled = isDisabled;
            };
            inInspectionCheckbox.removeEventListener(
              "change",
              toggleInspectionFields,
            );
            inInspectionCheckbox.addEventListener(
              "change",
              toggleInspectionFields,
            );

            inInspectionCheckbox.checked = isMultiSelect
              ? false
              : unitData.inInspection || false;
            toggleInspectionFields();

            stageSelect.value = isMultiSelect ? "cm" : "cm";

            const updateInspectionUI = () => {
              const stage = stageSelect.value;
              if (stage === "cm") {
                scoreInput.value = isMultiSelect ? "" : unitData.cmScore || "";
                defectCheckbox.checked = isMultiSelect
                  ? false
                  : unitData.cmHasMajorDefect || false;
              } else if (stage === "qc") {
                scoreInput.value = isMultiSelect ? "" : unitData.qcScore || "";
                defectCheckbox.checked = isMultiSelect
                  ? false
                  : unitData.qcHasMajorDefect || false;
              } else {
                // qc-cm
                scoreInput.value = isMultiSelect ? "" : unitData.qcScore || "";
                defectCheckbox.checked = isMultiSelect
                  ? false
                  : unitData.qcHasMajorDefect || false;
              }
            };
            updateInspectionUI();
            stageSelect.onchange = updateInspectionUI;
          } else if (categoryDef.type === "multi-progress") {
            const view = document.getElementById("modal-multi-progress-view");
            const isMultiSelect = selectedCells.size > 1;
            view.innerHTML = "";
            categoryDef.tasks.forEach((task) => {
              let isApplicable = false;
              selectedCells.forEach((cell) => {
                if (
                  !task.condition ||
                  task.condition(
                    parseInt(cell.dataset.floor),
                    parseInt(cell.dataset.room),
                  )
                ) {
                  isApplicable = true;
                }
              });
              if (!isApplicable) return;

              const progress = isMultiSelect
                ? ""
                : unitData[`progress_${task.key}`] || 0;
              view.innerHTML += `
                            <div class="mb-4">
                                <label for="progress-input-${task.key}" class="block text-sm font-medium text-gray-700">${task.name} (%):</label>
                                <input type="number" id="progress-input-${task.key}" data-key="${task.key}" min="0" max="100" value="${progress}" class="multi-progress-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
                            </div>
                        `;
            });
            view.classList.remove("hidden");
          } else {
            document
              .getElementById("modal-progress-view")
              .classList.remove("hidden");
            const categoryTasks = categoryDef.tasks;
            const taskSelect = document.getElementById("modal-task-select");
            const progressInput = document.getElementById("progress-input");
            const isMultiSelect = selectedCells.size > 1;

            const taskButtonsContainer =
              document.getElementById("modal-task-buttons");

            const renderTaskButtons = (selectedIndex) => {
              taskButtonsContainer.innerHTML = "";
              categoryTasks.forEach((task, index) => {
                let isApplicable = false;
                selectedCells.forEach((cell) => {
                  if (
                    !task.condition ||
                    task.condition(
                      parseInt(cell.dataset.floor),
                      parseInt(cell.dataset.room),
                    )
                  ) {
                    isApplicable = true;
                  }
                });
                if (!isApplicable) return;

                const isSelected = index === selectedIndex;
                const isPrevious = index < selectedIndex;

                let btnClass =
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 flex items-center gap-2 ";
                if (isSelected) {
                  btnClass +=
                    "bg-indigo-600 border-indigo-600 text-white shadow-md";
                } else if (isPrevious) {
                  btnClass +=
                    "bg-emerald-50 border-emerald-500 text-emerald-700";
                } else {
                  btnClass +=
                    "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-slate-50";
                }

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = btnClass;

                if (isPrevious) {
                  btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>${task.name}`;
                } else {
                  btn.textContent = task.name;
                }

                btn.onclick = () => {
                  taskSelect.value = index;
                  renderTaskButtons(index);
                };
                taskButtonsContainer.appendChild(btn);
              });
            };

            if (isMultiSelect) {
              taskSelect.value = 0;
              progressInput.value = "";
              renderTaskButtons(0);
            } else {
              let taskToShowIndex = unitData.taskIndex || 0;
              let progressToShow = unitData.progress || 0;
              if (
                progressToShow >= 100 &&
                taskToShowIndex < categoryTasks.length - 1
              ) {
                taskToShowIndex++;
                // Skip conditional tasks that don't apply
                while (
                  taskToShowIndex < categoryTasks.length - 1 &&
                  categoryTasks[taskToShowIndex].condition &&
                  !categoryTasks[taskToShowIndex].condition(
                    parseInt(floor),
                    parseInt(room),
                  )
                ) {
                  taskToShowIndex++;
                }
                progressToShow = 0;
              }
              taskSelect.value = taskToShowIndex;
              progressInput.value = progressToShow;
              renderTaskButtons(taskToShowIndex);
            }
          }

          openModal("updateModal");
        }

        function showConfirmModal(title, message, callback, triggerElement) {
          document.getElementById("confirm-title").textContent = title;
          document.getElementById("confirm-message").textContent = message;
          confirmCallback = callback;
          openModal("confirmModal", triggerElement);
        }

        function showNotificationModal(title, message) {
          document.getElementById("notification-title").textContent = title;
          document.getElementById("notification-message").textContent = message;
          openModal("notificationModal");
        }

        function showToast(message, duration = 3000) {
          const toast = document.getElementById("toast");
          const toastMessage = document.getElementById("toast-message");
          if (!toast || !toastMessage) return;

          toastMessage.textContent = message;
          toast.style.transform = "translateX(0)";

          clearTimeout(toastTimeout);
          toastTimeout = setTimeout(() => {
            toast.style.transform = "translateX(120%)";
          }, duration);
        }

        async function saveProgress() {
          const saveBtn = document.getElementById("saveProgressBtn");
          const originalBtnText = saveBtn.textContent;
          saveBtn.textContent = "กำลังบันทึก...";
          saveBtn.disabled = true;

          const updatedData = JSON.parse(JSON.stringify(projectData));

          if (currentView === "residential" || currentView === "qcSummary") {
            applyResidentialProgressUpdates(updatedData);
          } else {
            applyCommonAreaProgressUpdates(updatedData);
          }

          try {
            const { error } = await supabaseClient
              .from(CONFIG.DB_TABLE_NAME)
              .update({ data: updatedData })
              .eq("id", CONFIG.DB_ROW_ID);

            if (error) throw error;

            projectData = updatedData;
            renderTable();
            showToast("บันทึกข้อมูลสำเร็จ");
            closeModal("updateModal");
          } catch (error) {
            console.error("Error saving data to Supabase: ", error);
            showNotificationModal(
              "เกิดข้อผิดพลาด",
              "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
            );
          } finally {
            saveBtn.textContent = originalBtnText;
            saveBtn.disabled = false;
          }
        }

        function applyCommonAreaProgressUpdates(data) {
          const newProgress = parseInt(
            document.getElementById("progress-input").value,
            10,
          );
          if (isNaN(newProgress) || newProgress < 0 || newProgress > 100)
            return;

          selectedCells.forEach((cell) => {
            const { locationKey, taskIndex, floor } = cell.dataset;
            if (!data.commonArea) data.commonArea = {};
            if (!data.commonArea[locationKey])
              data.commonArea[locationKey] = { tasks: [] };
            if (!data.commonArea[locationKey].tasks[taskIndex])
              data.commonArea[locationKey].tasks[taskIndex] = { progress: {} };
            if (!data.commonArea[locationKey].tasks[taskIndex].progress)
              data.commonArea[locationKey].tasks[taskIndex].progress = {};
            data.commonArea[locationKey].tasks[taskIndex].progress[floor] =
              newProgress;
          });
        }

        function applyResidentialProgressUpdates(data) {
          const categoryDef = taskDefinitions[currentCategory];
          if (categoryDef.type === "inspection") {
            const inInspection = document.getElementById(
              "in-inspection-checkbox",
            ).checked;

            selectedCells.forEach((cell) => {
              const { floor, room } = cell.dataset;
              if (!data[currentCategory]) data[currentCategory] = {};
              if (!data[currentCategory][floor])
                data[currentCategory][floor] = {};
              if (!data[currentCategory][floor][room])
                data[currentCategory][floor][room] = {};
              const unitData = data[currentCategory][floor][room];

              if (inInspection) {
                unitData.inInspection = true;
                unitData.cmScore = 0;
                unitData.qcScore = 0;
                unitData.cmHasMajorDefect = false;
                unitData.qcHasMajorDefect = false;
              } else {
                unitData.inInspection = false;
                const stage = document.getElementById(
                  "inspection-stage-select",
                ).value;
                const newScoreStr =
                  document.getElementById("score-input").value;
                if (newScoreStr === "") return;
                const newScore = parseFloat(newScoreStr);
                if (isNaN(newScore) || newScore < 0 || newScore > 100) return;
                const hasDefect = document.getElementById(
                  "major-defect-checkbox",
                ).checked;

                if (stage === "cm") {
                  unitData.cmScore = newScore;
                  unitData.cmHasMajorDefect = hasDefect;
                } else if (stage === "qc") {
                  unitData.qcScore = newScore;
                  unitData.qcHasMajorDefect = hasDefect;
                  if (unitData.cmScore === 0) {
                    unitData.cmScore = 100;
                    unitData.cmHasMajorDefect = false;
                  }
                } else {
                  // qc-cm
                  unitData.cmScore = newScore;
                  unitData.cmHasMajorDefect = hasDefect;
                  unitData.qcScore = newScore;
                  unitData.qcHasMajorDefect = hasDefect;
                }
              }
            });
          } else if (categoryDef.type === "multi-progress") {
            const inputs = document.querySelectorAll(".multi-progress-input");
            selectedCells.forEach((cell) => {
              const { floor, room } = cell.dataset;
              if (!data[currentCategory]) data[currentCategory] = {};
              if (!data[currentCategory][floor])
                data[currentCategory][floor] = {};
              if (!data[currentCategory][floor][room])
                data[currentCategory][floor][room] = {};
              const unitData = data[currentCategory][floor][room];
              inputs.forEach((input) => {
                const valueStr = input.value;
                if (valueStr !== "") {
                  const value = parseInt(valueStr, 10);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    const task = categoryDef.tasks.find(
                      (t) => t.key === input.dataset.key,
                    );
                    if (
                      task &&
                      task.condition &&
                      !task.condition(parseInt(floor), parseInt(room))
                    )
                      return;
                    unitData[`progress_${input.dataset.key}`] = value;
                  }
                }
              });
            });
          } else {
            const selectedTaskIndex = parseInt(
              document.getElementById("modal-task-select").value,
              10,
            );
            const newProgressStr =
              document.getElementById("progress-input").value;
            if (newProgressStr === "") return;
            const newProgress = parseInt(newProgressStr, 10);
            if (isNaN(newProgress) || newProgress < 0 || newProgress > 100)
              return;

            selectedCells.forEach((cell) => {
              const { floor, room } = cell.dataset;
              if (!data[currentCategory]) data[currentCategory] = {};
              if (!data[currentCategory][floor])
                data[currentCategory][floor] = {};
              if (!data[currentCategory][floor][room])
                data[currentCategory][floor][room] = {};
              const unitData = data[currentCategory][floor][room];
              unitData.taskIndex = selectedTaskIndex;
              unitData.progress = newProgress;
            });
          }
        }

        // --- QUICK UPDATE MODE FUNCTIONS ---
        function setupQuickUpdateSelectors() {
          const floorSelectorContainer = document.getElementById(
            "quick-update-floor-selector-container",
          );
          floorSelectorContainer.innerHTML = "";
          const segmentedControl = document.createElement("div");
          segmentedControl.className = "ios-segmented-control";

          CONFIG.FLOORS.forEach((floor) => {
            const button = document.createElement("button");
            button.textContent = `ชั้น ${floor}`;
            button.dataset.floor = floor;
            segmentedControl.appendChild(button);
          });
          floorSelectorContainer.appendChild(segmentedControl);

          if (currentQuickUpdateRoom.floor) {
            const activeBtn = floorSelectorContainer.querySelector(
              `[data-floor="${currentQuickUpdateRoom.floor}"]`,
            );
            if (activeBtn) {
              activeBtn.classList.add("active");
              populateQuickUpdateRoomPills(currentQuickUpdateRoom.floor);
            }
          } else {
            populateQuickUpdateRoomPills(null);
          }
        }

        function doesRoomHaveProgress(floor, room) {
          if (!projectData || !floor || !room) return false;
          for (const catKey in taskDefinitions) {
            const catDef = taskDefinitions[catKey];
            const unitData = projectData[catKey]?.[floor]?.[room];
            if (!unitData) continue;

            if (catDef.type === "progress") {
              if ((unitData.progress || 0) > 0) return true;
            } else if (catDef.type === "multi-progress") {
              for (const task of catDef.tasks) {
                if ((unitData[`progress_${task.key}`] || 0) > 0) return true;
              }
            } else if (catDef.type === "inspection") {
              if (
                (unitData.cmScore || 0) > 0 ||
                (unitData.qcScore || 0) > 0 ||
                unitData.inInspection
              )
                return true;
            }
          }
          return false;
        }

        function populateQuickUpdateRoomPills(floor) {
          const roomPillsContainer = document.getElementById(
            "quick-update-room-selector-container",
          );
          roomPillsContainer.innerHTML = "";
          if (!floor) {
            roomPillsContainer.innerHTML = `<p class="text-sm text-slate-500 px-1 py-2">กรุณาเลือกชั้นก่อน</p>`;
            return;
          }
          const roomsOnThisFloor = CONFIG.getRoomsOnFloor(parseInt(floor, 10));
          for (let i = 1; i <= roomsOnThisFloor; i++) {
            const button = document.createElement("button");
            button.textContent = `ห้อง ${i}`;
            button.dataset.room = i;
            if (doesRoomHaveProgress(floor, i)) {
              button.classList.add("has-progress-indicator");
            }
            roomPillsContainer.appendChild(button);
          }

          if (currentQuickUpdateRoom.room) {
            const activePill = roomPillsContainer.querySelector(
              `[data-room="${currentQuickUpdateRoom.room}"]`,
            );
            if (activePill) activePill.classList.add("active");
          }
        }

        function renderQuickUpdateTaskList() {
          const taskListContainer = document.getElementById(
            "quick-update-task-list",
          );
          const { floor, room } = currentQuickUpdateRoom;

          if (!floor || !room) {
            taskListContainer.innerHTML = `<div class="text-center text-slate-500 p-8 mt-10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                        <h3 class="mt-2 text-lg font-semibold">เริ่มต้นอัพเดท</h3>
                        <p class="mt-1 text-base text-gray-500">กรุณาเลือกชั้นและห้องจากด้านบน</p>
                    </div>`;
            return;
          }

          const progressSteps = [0, 20, 40, 60, 80, 100];
          let html = "";
          Object.keys(taskDefinitions).forEach((catKey) => {
            if (["electrical", "plumbing", "airCon"].includes(catKey)) return;
            const catDef = taskDefinitions[catKey];
            const unitData = projectData[catKey]?.[floor]?.[room] || {};

            html += `<div class="ios-inset-grouped-table">`;
            html += `<div class="ios-table-header">${catDef.name}</div>`;

            const createProgressControl = (currentProgress) => {
              const pillIndex =
                progressSteps.indexOf(currentProgress) > -1
                  ? progressSteps.indexOf(currentProgress)
                  : 0;
              const pillTransform = `translateX(${pillIndex * 100}%)`;
              const buttons = progressSteps
                .map(
                  (p) =>
                    `<button data-progress="${p}" class="${currentProgress !== p ? "inactive" : ""}">${p}%</button>`,
                )
                .join("");

              return `<div class="ios-progress-control">
                                    <div class="background-pill" style="transform: ${pillTransform};"></div>
                                    ${buttons}
                                </div>`;
            };

            if (catDef.type === "progress") {
              catDef.tasks.forEach((task, index) => {
                if (
                  task.condition &&
                  !task.condition(parseInt(floor), parseInt(room))
                )
                  return;
                const isCompleted =
                  (unitData.taskIndex || 0) > index ||
                  ((unitData.taskIndex || 0) === index &&
                    (unitData.progress || 0) >= 100);
                const btnProgress = isCompleted
                  ? 100
                  : (unitData.taskIndex || 0) === index
                    ? unitData.progress || 0
                    : 0;

                html += `<div class="ios-table-cell" data-catkey="${catKey}" data-taskidx="${index}">
                                        <p class="task-name">${task.name}</p>
                                        ${createProgressControl(btnProgress)}
                                     </div>`;
              });
            } else if (catDef.type === "multi-progress") {
              catDef.tasks.forEach((task) => {
                if (
                  task.condition &&
                  !task.condition(parseInt(floor), parseInt(room))
                )
                  return;
                const progress = unitData[`progress_${task.key}`] || 0;
                html += `<div class="ios-table-cell" data-catkey="${catKey}" data-taskkey="${task.key}">
                                        <p class="task-name">${task.name}</p>
                                        ${createProgressControl(progress)}
                                     </div>`;
              });
            } else if (catDef.type === "inspection") {
              let statusText = "ยังไม่ตรวจ";
              let statusClass = "text-gray-500";
              if (unitData.inInspection) {
                statusText = "อยู่ระหว่างตรวจสอบ";
                statusClass = "text-yellow-600 font-semibold";
              } else if (unitData.qcScore > 0) {
                statusText = `QC: ${unitData.qcScore >= 85 ? "ผ่าน" : "ไม่ผ่าน"} (${unitData.qcScore})`;
                statusClass =
                  unitData.qcScore >= 85
                    ? "text-green-600 font-bold"
                    : "text-red-600 font-bold";
              } else if (unitData.cmScore > 0) {
                statusText = `CM: ${unitData.cmScore >= 85 ? "ผ่าน" : "ไม่ผ่าน"} (${unitData.cmScore})`;
                statusClass =
                  unitData.cmScore >= 85
                    ? "text-green-600 font-bold"
                    : "text-red-600 font-bold";
              }
              html += `<div class="ios-table-cell" data-catkey="${catKey}">
                                    <p class="task-name">ผลการตรวจสอบ</p>
                                    <div class="flex items-center">
                                         <p class="task-status ${statusClass}">${statusText}</p>
                                         <svg xmlns="http://www.w3.org/2000/svg" class="ios-disclosure-indicator" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                  </div>`;
            }
            html += `</div>`; // end of ios-inset-grouped-table
          });

          taskListContainer.innerHTML = html;
        }

        async function handleQuickUpdate(e) {
          const subTaskContainer = e.target.closest("[data-catkey]");
          if (!subTaskContainer) return;

          const { floor, room } = currentQuickUpdateRoom;
          if (!floor || !room) return;

          const catKey = subTaskContainer.dataset.catkey;
          const catDef = taskDefinitions[catKey];

          // If it's an inspection task, the whole cell is the trigger to open the modal.
          if (catDef.type === "inspection") {
            selectedCells.clear();
            // Create a dummy cell object to pass to the modal logic
            const dummyCell = document.createElement("td");
            dummyCell.dataset.floor = floor;
            dummyCell.dataset.room = room;
            selectedCells.add(dummyCell);
            currentCategory = catKey; // Temporarily set context for the modal
            openResidentialUpdateModal();
            return;
          }

          // For progress controls, ensure a button was the target
          const button = e.target.closest("button");
          if (!button) return;

          // Show spinner
          const spinnerOverlay = document.createElement("div");
          spinnerOverlay.className = "spinner-overlay";
          spinnerOverlay.innerHTML = '<div class="spinner-sm"></div>';
          subTaskContainer.appendChild(spinnerOverlay);

          const updatedData = JSON.parse(JSON.stringify(projectData));
          if (!updatedData[catKey]) updatedData[catKey] = {};
          if (!updatedData[catKey][floor]) updatedData[catKey][floor] = {};
          if (!updatedData[catKey][floor][room])
            updatedData[catKey][floor][room] = {};
          const unitData = updatedData[catKey][floor][room];

          if (catDef.type === "progress") {
            const taskIndex = parseInt(subTaskContainer.dataset.taskidx, 10);
            const progress = parseInt(button.dataset.progress, 10);

            // Logic to update other sub-tasks in the same category
            if (progress === 100) {
              // If completing this task
              for (let i = 0; i < taskIndex; i++) {
                // complete all previous tasks
                if (
                  catDef.tasks[i].condition &&
                  !catDef.tasks[i].condition(parseInt(floor), parseInt(room))
                )
                  continue;
                if ((updatedData[catKey][floor][room].taskIndex || 0) <= i) {
                  updatedData[catKey][floor][room].taskIndex = i;
                  updatedData[catKey][floor][room].progress = 100;
                }
              }
            } else if (progress === 0) {
              // If clearing this task
              for (let i = catDef.tasks.length - 1; i >= taskIndex; i--) {
                // clear this and all subsequent tasks
                if (
                  catDef.tasks[i].condition &&
                  !catDef.tasks[i].condition(parseInt(floor), parseInt(room))
                )
                  continue;
                if ((updatedData[catKey][floor][room].taskIndex || 0) >= i) {
                  updatedData[catKey][floor][room].taskIndex = i;
                  updatedData[catKey][floor][room].progress = 0;
                }
              }
            }
            unitData.taskIndex = taskIndex;
            unitData.progress = progress;
          } else if (catDef.type === "multi-progress") {
            const taskKey = subTaskContainer.dataset.taskkey;
            const progress = parseInt(button.dataset.progress, 10);
            unitData[`progress_${taskKey}`] = progress;
          }

          try {
            const { error } = await supabaseClient
              .from(CONFIG.DB_TABLE_NAME)
              .update({ data: updatedData })
              .eq("id", CONFIG.DB_ROW_ID);
            if (error) throw error;

            projectData = updatedData;
            renderQuickUpdateTaskList();
            showToast(`${catDef.name} ของห้อง ${floor}/${room} ถูกอัพเดทแล้ว`);
          } catch (error) {
            console.error("Quick update failed:", error);
            showNotificationModal("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
            // Re-render to revert optimistic UI changes
            renderQuickUpdateTaskList();
          } finally {
            // The realtime listener will handle the re-render, so we just remove the spinner
            if (subTaskContainer.contains(spinnerOverlay)) {
              subTaskContainer.removeChild(spinnerOverlay);
            }
          }
        }

        window.exportExcel = function () {
          openModal("exportExcelModal");
        };
        window.executeExportExcel = executeExportExcel;
        async function executeExportExcel(mode) {
          closeModal("exportExcelModal");
          if (typeof showToast === "function") {
            showToast("กำลังสร้างไฟล์ Excel โปรดรอสักครู่...");
          }

          try {
            const ExcelJS = window.ExcelJS;
            const workbook = new ExcelJS.Workbook();

            const originalView = currentView;
            const originalCat = currentCategory;

            let viewsToExport = [];
            if (mode === "current") {
              viewsToExport = [currentView];
            } else {
              viewsToExport = [
                "summaryReport",
                "qcSummary",
                "schedule",
                "qcHandover",
                "residential",
                "common",
              ];
            }

            for (const v of viewsToExport) {
              let baseSheetName = "Data";
              if (v === "residential") baseSheetName = "ห้องพัก";
              else if (v === "common") baseSheetName = "ส่วนกลาง";
              else if (v === "qcSummary") baseSheetName = "สรุปQC";
              else if (v === "summaryReport") baseSheetName = "รายงานสรุป";
              else if (v === "schedule") baseSheetName = "แผนงาน";
              else if (v === "qcHandover") baseSheetName = "แผนส่งห้องQC";

              // Set currentView so render function works correctly
              currentView = v;

              if (v === "residential") {
                const resCategories =
                  mode === "all"
                    ? Object.keys(taskDefinitions).filter(
                        (k) => taskDefinitions[k].type !== "inspection",
                      )
                    : [originalCat];
                for (const cat of resCategories) {
                  currentCategory = cat;
                  if (document.getElementById("task-category-container")) {
                    setupCategoryButtons();
                  }
                  enterAppView(v); // This calls renderTable()
                  await new Promise((r) => setTimeout(r, 50));

                  let table = document.getElementById("main-table");
                  if (table) {
                    let safeCatName = taskDefinitions[cat]
                      ? taskDefinitions[cat].name
                          .replace(/[\[\]*?\/\\:]/g, "")
                          .substring(0, 15)
                      : cat;
                    let sheetName = `${baseSheetName}-${safeCatName}`;
                    addTableToWorkbook(workbook, sheetName, table);
                  }
                }
              } else if (v === "summaryReport") {
                const modes = ["wetWork", "endProduct"];
                for (const sm of modes) {
                  summaryReportMode = sm;
                  enterAppView(v);
                  await new Promise((r) => setTimeout(r, 50));
                  let table = document.getElementById("main-table");
                  if (table) {
                    let sheetName = `${baseSheetName}-${sm === "wetWork" ? "WW" : "END"}`;
                    addTableToWorkbook(workbook, sheetName, table);
                  }
                }
              } else {
                enterAppView(v);
                await new Promise((r) => setTimeout(r, 50));
                let table = document.getElementById("main-table");
                if (table) {
                  addTableToWorkbook(workbook, baseSheetName, table);
                }
              }
            }

            // Restore state
            currentView = originalView;
            currentCategory = originalCat;
            if (originalView === "residential") {
              setupCategoryButtons();
            }
            enterAppView(originalView);

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            let filenameSuffix = mode === "current" ? currentView : "All";
            a.download = `[PYNN54] ${filenameSuffix}_${new Date().toISOString().split("T")[0]}.xlsx`;

            a.click();
            window.URL.revokeObjectURL(url);

            if (typeof showToast === "function") {
              showToast("ส่งออก Excel ระบบหลาย Sheet หรือตามที่เลือก สำเร็จ");
            }
          } catch (error) {
            console.error("Export Excel failed:", error);
            if (typeof showNotificationModal === "function") {
              showNotificationModal(
                "ส่งออกข้อมูลไม่สำเร็จ",
                "เกิดข้อผิดพลาดขณะส่งออก Excel โปรดลองใหม่อีกครั้ง",
              );
            } else {
              alert("เกิดข้อผิดพลาดขณะส่งออก Excel");
            }
          }
        }

        function addTableToWorkbook(workbook, sheetNameStr, table) {
          // Ensure unique sheet name limit 31 chars
          let sheetName = sheetNameStr
            .replace(/[\][*?\/\\:]/g, "")
            .substring(0, 31);
          // check if exists
          let count = 1;
          let finalName = sheetName;
          while (workbook.getWorksheet(finalName)) {
            finalName = `${sheetName}_${count}`.substring(0, 31);
            count++;
          }

          const worksheet = workbook.addWorksheet(finalName);

          // --- Add the visible report header if available ---
          let startRowOffset = 0;
          let headerAdded = false;

          let reportHeaderLight = document.getElementById(
            "report-header-modern",
          );
          let reportHeaderDark = document.getElementById("report-header");

          let activeHeader = null;
          if (
            reportHeaderStyle === "light" &&
            reportHeaderLight &&
            !reportHeaderLight.classList.contains("hidden")
          ) {
            activeHeader = reportHeaderLight;
          } else if (
            reportHeaderStyle === "dark" &&
            reportHeaderDark &&
            !reportHeaderDark.classList.contains("hidden")
          ) {
            activeHeader = reportHeaderDark;
          }

          if (activeHeader) {
            // Try to extract lines of text from the header
            // Usually we have strong/h1 elements, let's grab the text content
            // and write to the first few rows
            const headerTexts = [];
            // Using a simple strategy: clone and replace block elements with newlines
            let clone = activeHeader.cloneNode(true);

            // Simple extraction of h1, h2, div text that looks like labels
            const titleEl = clone.querySelector("h1, h2");
            if (titleEl) {
              headerTexts.push(titleEl.textContent.trim());
            } else if (taskDefinitions[currentCategory]) {
              headerTexts.push(
                taskDefinitions[currentCategory].title ||
                  taskDefinitions[currentCategory].name,
              );
            } else if (sheetNameStr === "สรุปQC") {
              headerTexts.push("REPORT : สรุปจำนวนห้อง Defect QC/CM");
            } else if (sheetNameStr === "แผ่นส่งห้องQC") {
              headerTexts.push("แผนส่งห้องให้ QC / โอน");
            }

            const pEls = clone.querySelectorAll("p, .text-sm, span");
            pEls.forEach((p) => {
              let txt = p.textContent.replace(/\s+/g, " ").trim();
              // exclude specific icon chars or empty
              if (txt && !headerTexts.includes(txt) && txt.length > 2) {
                headerTexts.push(txt);
              }
            });

            if (headerTexts.length === 0) {
              // fallback
              let fallbackText = activeHeader.textContent
                .replace(/\s+/g, " ")
                .trim();
              if (fallbackText) headerTexts.push(fallbackText);
            }

            for (let i = 0; i < headerTexts.length; i++) {
              const cell = worksheet.getCell(i + 1, 1);
              cell.value = headerTexts[i];
              cell.font = {
                name: "Sarabun",
                bold: i === 0,
                size: i === 0 ? 16 : 12,
                color: {
                  argb: reportHeaderStyle === "dark" ? "FFFFFFFF" : "FF000000",
                },
              };

              if (reportHeaderStyle === "dark") {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FF1E3A8A" },
                }; // bg-[#1e3a8a]
              }
            }

            // Style the header area
            if (reportHeaderStyle === "dark") {
              for (let i = 0; i < headerTexts.length; i++) {
                for (let col = 1; col <= 10; col++) {
                  worksheet.getCell(i + 1, col).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF1E3A8A" },
                  };
                }
              }
            }

            startRowOffset = headerTexts.length + 1; // blank line after
            headerAdded = true;
          }

          // --------- Write Table -----------

          const cellMatrix = [];
          const originalRows = table.rows;

          for (let r = 0; r < originalRows.length; r++) {
            const tr = originalRows[r];
            let c = 0;

            for (let i = 0; i < tr.cells.length; i++) {
              const td = tr.cells[i];

              while (cellMatrix[r] && cellMatrix[r][c]) {
                c++;
              }

              const style = window.getComputedStyle(td);
              let text = (td.textContent || "").replace(/\s+/g, " ").trim();

              const input = td.querySelector("input");
              const select = td.querySelector("select");
              if (input && input.type !== "hidden") {
                text = input.value;
              } else if (select) {
                const opt = select.options[select.selectedIndex];
                if (opt) text = opt.text;
              } else if (!text || text === "") {
                const classList = td.className || "";
                const innerHtmlStr = td.innerHTML || "";
                if (
                  classList.includes("bg-emerald-") ||
                  classList.includes("bg-teal-") ||
                  innerHtmlStr.includes("bg-emerald-") ||
                  innerHtmlStr.includes("bg-teal-")
                ) {
                  text = "✓";
                } else if (
                  classList.includes("bg-rose-") ||
                  innerHtmlStr.includes("bg-rose-")
                ) {
                  text = "✗";
                } else if (
                  classList.includes("bg-amber-") ||
                  classList.includes("bg-yellow-") ||
                  innerHtmlStr.includes("bg-amber-") ||
                  innerHtmlStr.includes("bg-yellow-")
                ) {
                  text = "⚠";
                }
              }

              if (td.classList.contains("separator-cell")) {
                text = "";
              }

              const rowSpan = td.rowSpan || 1;
              const colSpan = td.colSpan || 1;

              let argbBg = "FFFFFFFF";
              if (
                style.backgroundColor &&
                style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
                style.backgroundColor !== "transparent"
              ) {
                const bgColorMatch = style.backgroundColor.match(
                  /^rgba?\((\d+),\s*(\d+),\s*(\d+)/,
                );
                if (bgColorMatch) {
                  argbBg =
                    "FF" +
                    parseInt(bgColorMatch[1])
                      .toString(16)
                      .padStart(2, "0")
                      .toUpperCase() +
                    parseInt(bgColorMatch[2])
                      .toString(16)
                      .padStart(2, "0")
                      .toUpperCase() +
                    parseInt(bgColorMatch[3])
                      .toString(16)
                      .padStart(2, "0")
                      .toUpperCase();
                }
              }

              let argbFont = "FF000000";
              if (style.color) {
                const fontColorMatch = style.color.match(
                  /^rgba?\((\d+),\s*(\d+),\s*(\d+)/,
                );
                if (fontColorMatch) {
                  argbFont =
                    "FF" +
                    parseInt(fontColorMatch[1])
                      .toString(16)
                      .padStart(2, "0")
                      .toUpperCase() +
                    parseInt(fontColorMatch[2])
                      .toString(16)
                      .padStart(2, "0")
                      .toUpperCase() +
                    parseInt(fontColorMatch[3])
                      .toString(16)
                      .padStart(2, "0")
                      .toUpperCase();
                }
              }

              const isBold =
                Number(style.fontWeight) >= 600 ||
                style.fontWeight === "bold" ||
                td.tagName.toUpperCase() === "TH" ||
                td.classList.contains("font-bold") ||
                td.classList.contains("font-semibold");
              const isSeparator = td.classList.contains("separator-cell");

              let alignH = "left";
              if (style.textAlign === "center") alignH = "center";
              if (style.textAlign === "right") alignH = "right";
              if (td.classList.contains("text-center")) alignH = "center";
              if (td.classList.contains("text-right")) alignH = "right";

              for (let rr = 0; rr < rowSpan; rr++) {
                for (let cc = 0; cc < colSpan; cc++) {
                  if (!cellMatrix[r + rr]) cellMatrix[r + rr] = [];
                  cellMatrix[r + rr][c + cc] = true;

                  const targetRow = r + rr + 1 + startRowOffset;
                  const targetCol = c + cc + 1;
                  const innerCell = worksheet.getCell(targetRow, targetCol);

                  if (argbBg !== "FFFFFFFF") {
                    innerCell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: argbBg },
                    };
                  }

                  innerCell.font = {
                    name: "Sarabun",
                    bold: isBold,
                    color: { argb: argbFont },
                  };
                  innerCell.alignment = {
                    vertical: "middle",
                    horizontal: alignH,
                    wrapText: true,
                  };

                  if (!isSeparator) {
                    let borderColor = "FFCBD5E1"; // slate-300
                    if (
                      td.classList.contains("border-black") ||
                      td.classList.contains("border-slate-800") ||
                      td.classList.contains("border-slate-500")
                    ) {
                      borderColor = "FF64748B"; // slate-500
                    }
                    innerCell.border = {
                      top: { style: "thin", color: { argb: borderColor } },
                      left: { style: "thin", color: { argb: borderColor } },
                      bottom: { style: "thin", color: { argb: borderColor } },
                      right: { style: "thin", color: { argb: borderColor } },
                    };
                  }
                }
              }

              const writeRow = r + 1 + startRowOffset;
              const writeCol = c + 1;
              const cell = worksheet.getCell(writeRow, writeCol);
              cell.value = text;

              if (rowSpan > 1 || colSpan > 1) {
                worksheet.mergeCells(
                  writeRow,
                  writeCol,
                  writeRow + rowSpan - 1,
                  writeCol + colSpan - 1,
                );
              }

              c += colSpan;
            }
          }

          worksheet.columns.forEach((column) => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
              if (headerAdded && rowNumber <= startRowOffset) return; // Skip header rows for width calculation
              const val = cell.value ? cell.value.toString().trim() : "";
              const length = val.length * 1.2;
              if (length > maxLength) {
                maxLength = length;
              }
            });
            column.width = Math.max(8, Math.min(maxLength + 2, 40));
          });
        }

        function exportData() {
          try {
            const dataStr = JSON.stringify(projectData, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement("a");
            link.download = `pynn-ngamwongwan-54-data-${Date.now()}.json`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            showToast("ส่งออกข้อมูลสำเร็จ");
          } catch (error) {
            console.error("Export failed:", error);
            showNotificationModal(
              "ส่งออกข้อมูลไม่สำเร็จ",
              "เกิดข้อผิดพลาดขณะเตรียมข้อมูลสำหรับส่งออก",
            );
          }
        }

        function importData(event) {
          const file = event.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const importedData = JSON.parse(e.target.result);
              if (!importedData.skimAndPaint) {
                throw new Error("ไฟล์ข้อมูลไม่ตรงกับโครงสร้างที่คาดไว้");
              }
              showConfirmModal(
                "ยืนยันการนำเข้าข้อมูล",
                "การนำเข้าข้อมูลจะเขียนทับข้อมูลบนเซิร์ฟเวอร์ทั้งหมด คุณแน่ใจหรือไม่?",
                async () => {
                  try {
                    const { error } = await supabaseClient
                      .from(CONFIG.DB_TABLE_NAME)
                      .update({ data: importedData })
                      .eq("id", CONFIG.DB_ROW_ID);
                    if (error) throw error;

                    projectData = importedData;
                    renderTable();
                    showToast("นำเข้าข้อมูลเรียบร้อยแล้ว");
                  } catch (err) {
                    console.error("Supabase update failed:", err);
                    showNotificationModal(
                      "เกิดข้อผิดพลาด",
                      "ไม่สามารถเขียนข้อมูลลงฐานข้อมูลได้",
                    );
                  } finally {
                    closeModal("confirmModal");
                  }
                },
              );
            } catch (err) {
              console.error("Error parsing JSON file:", err);
              showNotificationModal(
                "เกิดข้อผิดพลาด",
                `ไฟล์ที่นำเข้าไม่ถูกต้อง: ${err.message}`,
              );
            }
          };
          reader.readAsText(file);
          event.target.value = "";
        }

        function getThaiDateForFilename() {
            const today = new Date();
            const monthNamesShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
            const d = String(today.getDate()).padStart(2, '0');
            const m = monthNamesShort[today.getMonth()];
            const y = today.getFullYear() + 543;
            return `${d} ${m} ${y}`;
        }

        function getFileExportName() {
            let name = "สรุปรายงาน";
            switch (currentView) {
              case 'residential': 
                  const catName = taskDefinitions[currentCategory]?.name || currentCategory;
                  name = `ห้องพัก ${catName}`;
                  break;
              case 'qcSummary': name = 'สรุป QC'; break;
              case 'summaryReport': name = 'รายงานสรุป'; break;
              case 'common': name = 'ส่วนกลาง'; break;
              case 'qcHandover': name = 'แผนส่งห้อง QC'; break;
              case 'schedule': 
                  name = 'แผนงานโครงการ';
                  if (globalScheduleFilters.showWetWork && !globalScheduleFilters.showEndProduct) {
                      name += " WET WORK";
                  } else if (!globalScheduleFilters.showWetWork && globalScheduleFilters.showEndProduct) {
                      name += " END PRODUCT";
                  } else if (globalScheduleFilters.showWetWork && globalScheduleFilters.showEndProduct) {
                      name += " WET WORK & END PRODUCT";
                  }
                  break;
              default: name = currentView;
            }
            return `PYNN NGAMWONGWAN 54 ${name} ${getThaiDateForFilename()}`;
        }

        function captureForLine(
          mode = "download",
          btnId = "captureDownloadBtn",
        ) {
          const captureArea = document.getElementById("capture-area");
          const captureBtn = document.getElementById(btnId);
          const originalBtnHTML = captureBtn.innerHTML;

          captureBtn.innerHTML = "กำลังแคปเจอร์...";
          captureBtn.disabled = true;

          // Save scroll position
          const scrollX = window.scrollX || window.pageXOffset;
          const scrollY = window.scrollY || window.pageYOffset;

          // Scroll to top-left to avoid html2canvas clipping issues on mobile
          window.scrollTo(0, 0);

          document.documentElement.classList.add("is-line-capturing");
          document.body.classList.add("is-line-capturing");

          const table = document.getElementById("main-table");
          const fullWidth =
            table && !table.classList.contains("hidden")
              ? Math.max(table.scrollWidth, table.offsetWidth)
              : Math.max(captureArea.scrollWidth, 1200);

          // Force inline widths to prevent clipping
          const originalCaptureAreaWidth = captureArea.style.width;
          const originalBodyWidth = document.body.style.width;
          const originalHtmlWidth = document.documentElement.style.width;
          const mainAppContainer =
            document.getElementById("main-app-container");
          const originalMainAppWidth = mainAppContainer.style.width;

          const execDashboard = document.getElementById(
            "executive-summary-dashboard",
          );
          const originalExecWidth = execDashboard
            ? execDashboard.style.width
            : "";
          const originalExecMaxWidth = execDashboard
            ? execDashboard.style.maxWidth
            : "";

          captureArea.style.width = fullWidth + "px";
          document.body.style.width = fullWidth + "px";
          document.documentElement.style.width = fullWidth + "px";
          mainAppContainer.style.width = fullWidth + "px";
          if (execDashboard && currentView === "schedule") {
            execDashboard.style.width = fullWidth + "px";
            execDashboard.style.maxWidth = fullWidth + "px";
          }

          setTimeout(() => {
            const finalWidth = captureArea.scrollWidth;
            const finalHeight = captureArea.scrollHeight;

            // For LINE App specifically, too large an image causes aggressive compression and bluriness.
            // Using a scale between 1.5 to 2 is optimal for LINE readability.
            const isMobile = window.innerWidth <= 768;
            const captureScale = isMobile ? 1.5 : 2;

            html2canvas(captureArea, {
              scale: captureScale,
              useCORS: true,
              backgroundColor: "#ffffff",
              width: finalWidth,
              height: finalHeight,
              windowWidth: finalWidth,
              windowHeight: finalHeight,
              scrollX: 0,
              scrollY: 0,
            })
              .then((canvas) => {
                const filename = `${getFileExportName()}.jpg`;
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

                function fallbackDownload() {
                  const link = document.createElement("a");
                  link.download = filename;
                  link.href = dataUrl;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }

                if (mode === "share") {
                  // Try to use Web Share API if available (great for mobile)
                  if (navigator.share && navigator.canShare) {
                    canvas.toBlob((blob) => {
                      if (!blob) {
                        fallbackDownload();
                        return;
                      }
                      const file = new File([blob], filename, {
                        type: "image/jpeg",
                      });
                      if (navigator.canShare({ files: [file] })) {
                        navigator
                          .share({
                            files: [file],
                            title: "รายงานความคืบหน้า",
                          })
                          .catch((err) => {
                            console.error("Share failed:", err);
                            if (err.name !== "AbortError") {
                              fallbackDownload();
                            }
                          });
                      } else {
                        fallbackDownload();
                      }
                    }, "image/jpeg", 0.9);
                  } else {
                    fallbackDownload();
                  }
                } else {
                  fallbackDownload();
                }
              })
              .catch((err) => {
                console.error("Capture failed:", err);
                showNotificationModal(
                  "เกิดข้อผิดพลาด",
                  "ไม่สามารถสร้างไฟล์ภาพได้",
                );
              })
              .finally(() => {
                document.documentElement.classList.remove("is-line-capturing");
                document.body.classList.remove("is-line-capturing");

                // Restore inline widths
                captureArea.style.width = originalCaptureAreaWidth;
                document.body.style.width = originalBodyWidth;
                document.documentElement.style.width = originalHtmlWidth;
                mainAppContainer.style.width = originalMainAppWidth;
                if (execDashboard) {
                  execDashboard.style.width = originalExecWidth;
                  execDashboard.style.maxWidth = originalExecMaxWidth;
                }

                captureBtn.innerHTML = originalBtnHTML;
                captureBtn.disabled = false;
                // Restore scroll position
                window.scrollTo(scrollX, scrollY);
              });
          }, 500); // Increased timeout to ensure rendering
        }

        function captureForLineNew(mode = "download", btnId = "captureNewBtn", isUltraHD = false) {
          const captureArea = document.getElementById("capture-area");
          const captureBtn = document.getElementById(btnId);
          const originalBtnHTML = captureBtn.innerHTML;

          captureBtn.innerHTML = "กำลังแคปเจอร์...";
          captureBtn.disabled = true;

          // Save scroll position
          const scrollX = window.scrollX || window.pageXOffset;
          const scrollY = window.scrollY || window.pageYOffset;

          // Scroll to top-left to avoid clipping issues
          window.scrollTo(0, 0);

          document.documentElement.classList.add("is-line-capturing");
          document.body.classList.add("is-line-capturing");

          const table = document.getElementById("main-table");
          const fullWidth =
            table && !table.classList.contains("hidden")
              ? Math.max(table.scrollWidth, table.offsetWidth)
              : Math.max(captureArea.scrollWidth, 1200);

          // Force inline widths to prevent clipping
          const originalCaptureAreaWidth = captureArea.style.width;
          const originalBodyWidth = document.body.style.width;
          const originalHtmlWidth = document.documentElement.style.width;
          const mainAppContainer =
            document.getElementById("main-app-container");
          const originalMainAppWidth = mainAppContainer.style.width;

          const execDashboard = document.getElementById(
            "executive-summary-dashboard",
          );
          const originalExecWidth = execDashboard
            ? execDashboard.style.width
            : "";
          const originalExecMaxWidth = execDashboard
            ? execDashboard.style.maxWidth
            : "";

          captureArea.style.width = fullWidth + "px";
          document.body.style.width = fullWidth + "px";
          document.documentElement.style.width = fullWidth + "px";
          mainAppContainer.style.width = fullWidth + "px";
          if (execDashboard && currentView === "schedule") {
            execDashboard.style.width = fullWidth + "px";
            execDashboard.style.maxWidth = fullWidth + "px";
          }

          setTimeout(() => {
            const finalWidth = captureArea.scrollWidth;
            const finalHeight = captureArea.scrollHeight;

            // For LINE App specifically, too large an image causes aggressive compression and bluriness.
            // Using a scale between 1.5 to 2 is optimal for LINE readability.
            const isMobile = window.innerWidth <= 768;
            const captureScale = isUltraHD ? (isMobile ? 3 : 4) : (isMobile ? 1.5 : 2);
            
            // Use html-to-image which handles SVGs and scaling much better
            const captureOptions = {
                quality: isUltraHD ? 1.0 : 0.9,
                backgroundColor: "#ffffff",
                pixelRatio: captureScale,
                width: finalWidth,
                height: finalHeight,
                style: {
                  transformOrigin: "top left",
                },
            };
            
            const capturePromise = isUltraHD 
                ? htmlToImage.toPng(captureArea, captureOptions)
                : htmlToImage.toJpeg(captureArea, captureOptions);

            capturePromise
              .then((dataUrl) => {
                const filename = `${getFileExportName()}.${isUltraHD ? 'png' : 'jpg'}`;

                function fallbackDownload() {
                  const link = document.createElement("a");
                  link.download = filename;
                  link.href = dataUrl;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }

                if (mode === "share") {
                  // Try to use Web Share API if available
                  if (navigator.share && navigator.canShare) {
                    fetch(dataUrl)
                      .then((res) => res.blob())
                      .then((blob) => {
                        const file = new File([blob], filename, {
                          type: isUltraHD ? "image/png" : "image/jpeg",
                        });
                        if (navigator.canShare({ files: [file] })) {
                          navigator
                            .share({
                              files: [file],
                              title: "รายงานความคืบหน้า",
                            })
                            .catch((err) => {
                              console.error("Share failed:", err);
                              if (err.name !== "AbortError") {
                                fallbackDownload();
                              }
                            });
                        } else {
                          fallbackDownload();
                        }
                      });
                  } else {
                    fallbackDownload();
                  }
                } else {
                  fallbackDownload();
                }
              })
              .catch((err) => {
                console.error("Capture failed:", err);
                showNotificationModal(
                  "เกิดข้อผิดพลาด",
                  "ไม่สามารถสร้างไฟล์ภาพได้ (อาจเกิดจากข้อจำกัดของเบราว์เซอร์หรือรูปภาพข้ามโดเมน)",
                );
              })
              .finally(() => {
                document.documentElement.classList.remove("is-line-capturing");
                document.body.classList.remove("is-line-capturing");

                // Restore inline widths
                captureArea.style.width = originalCaptureAreaWidth;
                document.body.style.width = originalBodyWidth;
                document.documentElement.style.width = originalHtmlWidth;
                mainAppContainer.style.width = originalMainAppWidth;
                if (execDashboard) {
                  execDashboard.style.width = originalExecWidth;
                  execDashboard.style.maxWidth = originalExecMaxWidth;
                }

                captureBtn.innerHTML = originalBtnHTML;
                captureBtn.disabled = false;
                // Restore scroll position
                window.scrollTo(scrollX, scrollY);
              });
          }, 500);
        }

        function exportAsPdfNew() {
          const captureArea = document.getElementById("capture-area");
          const captureBtn = document.getElementById("exportPdfBtn");
          if (!captureBtn || !captureArea) return;
          const originalBtnHTML = captureBtn.innerHTML;

          captureBtn.innerHTML = "กำลังส่งออก PDF...";
          captureBtn.disabled = true;

          // Save scroll position
          const scrollX = window.scrollX || window.pageXOffset;
          const scrollY = window.scrollY || window.pageYOffset;

          window.scrollTo(0, 0);

          document.documentElement.classList.add("is-line-capturing");
          document.body.classList.add("is-line-capturing");

          const table = document.getElementById("main-table");
          const fullWidth =
            table && !table.classList.contains("hidden")
              ? Math.max(table.scrollWidth, table.offsetWidth)
              : Math.max(captureArea.scrollWidth, 1200);

          const mainAppContainer = document.getElementById("main-app-container");
          const execDashboard = document.getElementById("executive-summary-dashboard");

          const originalStyles = {
            captureAreaWidth: captureArea.style.width,
            bodyWidth: document.body.style.width,
            htmlWidth: document.documentElement.style.width,
            mainAppWidth: mainAppContainer.style.width,
            execWidth: execDashboard ? execDashboard.style.width : "",
            execMaxWidth: execDashboard ? execDashboard.style.maxWidth : "",
          };

          captureArea.style.width = fullWidth + "px";
          document.body.style.width = fullWidth + "px";
          document.documentElement.style.width = fullWidth + "px";
          mainAppContainer.style.width = fullWidth + "px";
          if (execDashboard && currentView === "schedule") {
            execDashboard.style.width = fullWidth + "px";
            execDashboard.style.maxWidth = fullWidth + "px";
          }

          setTimeout(() => {
            const finalWidth = captureArea.scrollWidth;
            const finalHeight = captureArea.scrollHeight;
            const captureScale = 2; // For PDF, we want high quality

            htmlToImage
              .toJpeg(captureArea, {
                quality: 0.95,
                backgroundColor: "#ffffff",
                pixelRatio: captureScale,
                width: finalWidth,
                height: finalHeight,
                style: {
                  transformOrigin: "top left",
                },
              })
              .then((dataUrl) => {
                const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
                if (!jsPDF) {
                    throw new Error("jsPDF library not loaded");
                }
                // Calculate orientation
                const isLandscape = finalWidth > finalHeight;
                
                const pdf = new jsPDF(isLandscape ? "l" : "p", "mm", [finalWidth * 0.264583, finalHeight * 0.264583]);
                
                pdf.addImage(dataUrl, "JPEG", 0, 0, finalWidth * 0.264583, finalHeight * 0.264583);
                
                const filename = `${getFileExportName()}.pdf`;
                pdf.save(filename);
              })
              .catch((err) => {
                console.error("PDF generation failed:", err);
                alert("ไม่สามารถสร้าง PDF ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
              })
              .finally(() => {
                document.documentElement.classList.remove("is-line-capturing");
                document.body.classList.remove("is-line-capturing");

                captureArea.style.width = originalStyles.captureAreaWidth;
                document.body.style.width = originalStyles.bodyWidth;
                document.documentElement.style.width = originalStyles.htmlWidth;
                mainAppContainer.style.width = originalStyles.mainAppWidth;
                if (execDashboard && currentView === "schedule") {
                  execDashboard.style.width = originalStyles.execWidth;
                  execDashboard.style.maxWidth = originalStyles.execMaxWidth;
                }

                window.scrollTo(scrollX, scrollY);

                captureBtn.innerHTML = originalBtnHTML;
                captureBtn.disabled = false;
              });
          }, 1000); // Allow time for DOM updates
        }

        function generatePDFReport() {
          const selections = getReportSelections();
          const { orderedTaskKeys, tasks, floors } = selections;

          if (orderedTaskKeys.length === 0 || floors.length === 0) {
            showNotificationModal(
              "ข้อมูลไม่เพียงพอ",
              "กรุณาเลือก 'งาน' และ 'ชั้น' ที่ต้องการสร้าง PDF",
            );
            return;
          }

          const orientation = document.querySelector(
            'input[name="pdf-orientation"]:checked',
          ).value;
          const isLandscape = orientation === "landscape";
          const useDetailedGrid =
            document.getElementById("report-detailed-grid")?.checked || false;

          // A4 size in pixels (at 96 DPI approx)
          const pageWidth = isLandscape ? 1400 : 1000;

          let pdfContainer = document.getElementById(
            "pdf-generation-container",
          );
          if (!pdfContainer) {
            pdfContainer = document.createElement("div");
            pdfContainer.id = "pdf-generation-container";
            pdfContainer.style.position = "absolute";
            pdfContainer.style.top = "-9999px";
            pdfContainer.style.left = "-9999px";
            pdfContainer.style.width = `${pageWidth}px`;
            pdfContainer.style.backgroundColor = "#ffffff";
            pdfContainer.style.padding = "40px";
            document.body.appendChild(pdfContainer);
          }
          pdfContainer.innerHTML = "";

          // Header
          const today = new Date();
          const dateString = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() + 543}`;

          const headerHTML = `
                    <div class="mb-8 text-center">
                        <h1 class="text-3xl font-bold text-slate-800 mb-2">รายงานความคืบหน้าโครงการ PYNN NGAMWONGWAN 54</h1>
                        <p class="text-lg text-slate-600">ประจำวันที่: ${dateString}</p>
                    </div>
                `;
          pdfContainer.innerHTML += headerHTML;

          // Render Tables for each category
          orderedTaskKeys.forEach((catKey) => {
            const catDef = taskDefinitions[catKey];
            if (!tasks[catKey] || tasks[catKey].length === 0) return;

            const categoryTitle = `
                        <div class="mb-4 mt-8 break-inside-avoid">
                            <h2 class="text-xl font-bold text-white bg-slate-800 px-4 py-2 rounded-lg inline-block">
                                ${catDef.reportEmoji} ${catDef.reportName}
                            </h2>
                        </div>
                    `;
            pdfContainer.innerHTML += categoryTitle;

            if (useDetailedGrid && catDef.type === "multi-progress") {
              // RENDER DETAILED GRID (LIKE THE IMAGE)
              const table = document.createElement("table");
              table.className =
                "w-full border-collapse border border-slate-400 text-[10px] mb-8 break-inside-avoid shadow-sm";

              // Header
              let theadHTML = `<thead class="bg-slate-100 text-slate-800 font-bold">
                            <tr>
                                <th class="border border-slate-400 p-1 w-8" rowspan="2">ชั้น</th>
                                <th class="border border-slate-400 p-1 w-24" rowspan="2">รายการ</th>
                                <th class="border border-slate-400 p-1" colspan="${CONFIG.MAX_ROOMS}">ROOM No.</th>
                                <th class="border border-slate-400 p-1 w-16" rowspan="2">จำนวน</th>
                                <th class="border border-slate-400 p-1 w-12" rowspan="2">เสร็จ</th>
                                <th class="border border-slate-400 p-1 w-12" rowspan="2">คงเหลือ</th>
                            </tr>
                            <tr>`;
              for (let i = 1; i <= CONFIG.MAX_ROOMS; i++) {
                theadHTML += `<th class="border border-slate-400 p-0.5 text-center w-6">${i}</th>`;
              }
              theadHTML += `</tr></thead>`;
              table.innerHTML = theadHTML;

              const tbody = document.createElement("tbody");
              floors.forEach((floor) => {
                const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
                const selectedSubtasks = tasks[catKey].map(
                  (idx) => catDef.tasks[idx],
                );

                // Calculate floor summary
                let floorFinishedCount = 0;
                for (let room = 1; room <= CONFIG.MAX_ROOMS; room++) {
                  if (room > roomsOnThisFloor) continue;

                  const unitData = projectData[catKey]?.[floor]?.[room] || {};
                  let allDone = true;
                  selectedSubtasks.forEach((task) => {
                    if (task.condition && !task.condition(floor, room)) return;
                    if ((unitData[`progress_${task.key}`] || 0) < 100)
                      allDone = false;
                  });
                  if (allDone) floorFinishedCount++;
                }

                selectedSubtasks.forEach((task, sIdx) => {
                  const row = document.createElement("tr");

                  // Floor Cell (Merged)
                  if (sIdx === 0) {
                    row.innerHTML += `<td class="border border-slate-400 p-1 font-bold text-center bg-slate-50" rowspan="${selectedSubtasks.length}">${floor}</td>`;
                  }

                  // Task Name
                  row.innerHTML += `<td class="border border-slate-400 p-1 bg-white">${task.name}</td>`;

                  let taskCompletedCount = 0;

                  // Room Cells
                  for (let room = 1; room <= CONFIG.MAX_ROOMS; room++) {
                    if (room > roomsOnThisFloor) {
                      row.innerHTML += `<td class="border border-slate-400 p-0.5 bg-slate-100"></td>`;
                      continue;
                    }

                    const unitData = projectData[catKey]?.[floor]?.[room] || {};
                    let cellContent = "";
                    let cellClass = "bg-white";

                    if (task.condition && !task.condition(floor, room)) {
                      cellClass = "bg-slate-50 text-slate-300";
                      cellContent = "N/A";
                    } else {
                      const progress = unitData[`progress_${task.key}`] || 0;
                      if (progress >= 100) {
                        cellClass = "bg-emerald-500 text-white";
                        cellContent = "100%";
                        taskCompletedCount++;
                      } else if (progress > 0) {
                        cellClass = "bg-cyan-100 text-cyan-800";
                        cellContent = `${progress}%`;
                      }
                    }
                    row.innerHTML += `<td class="border border-slate-400 p-0.5 text-center ${cellClass}">${cellContent}</td>`;
                  }

                  // Task Summary (จำนวน)
                  row.innerHTML += `<td class="border border-slate-400 p-1 text-center font-bold">${taskCompletedCount}</td>`;

                  // Floor Summary (เสร็จ / คงเหลือ) - Merged
                  if (sIdx === 0) {
                    const remaining = roomsOnThisFloor - floorFinishedCount;
                    row.innerHTML += `<td class="border border-slate-400 p-1 text-center font-bold text-emerald-600 bg-emerald-50" rowspan="${selectedSubtasks.length}">${floorFinishedCount}</td>`;
                    row.innerHTML += `<td class="border border-slate-400 p-1 text-center font-bold text-rose-600 bg-rose-50" rowspan="${selectedSubtasks.length}">${remaining}</td>`;
                  }

                  tbody.appendChild(row);
                });
              });
              table.appendChild(tbody);
              pdfContainer.appendChild(table);
            } else {
              // STANDARD TABLE
              const table = document.createElement("table");
              table.className =
                "w-full border-collapse border border-slate-300 text-sm mb-8 break-inside-avoid shadow-sm";

              // Table Header
              let theadHTML = '<thead class="bg-slate-100 text-slate-700">';
              theadHTML += "<tr>";
              theadHTML +=
                '<th class="border border-slate-300 p-2 w-16 text-center">ชั้น</th>';
              theadHTML += `<th class="border border-slate-300 p-2 text-center" colspan="${CONFIG.MAX_ROOMS}">ROOM No.</th>`;
              theadHTML +=
                '<th class="border border-slate-300 p-2 w-24 text-center">สรุป</th>';
              theadHTML += "</tr>";

              // Room Numbers Row
              theadHTML += "<tr>";
              theadHTML += '<th class="border border-slate-300 p-1"></th>'; // Empty for floor
              for (let i = 1; i <= CONFIG.MAX_ROOMS; i++) {
                theadHTML += `<th class="border border-slate-300 p-1 text-center text-xs text-slate-500">${i}</th>`;
              }
              theadHTML += '<th class="border border-slate-300 p-1"></th>'; // Empty for summary
              theadHTML += "</tr></thead>";
              table.innerHTML = theadHTML;

              // Table Body
              const tbody = document.createElement("tbody");
              floors.forEach((floor) => {
                const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);

                // For each selected subtask in this category
                tasks[catKey].forEach((taskIndex) => {
                  const task = catDef.tasks[taskIndex];
                  const row = document.createElement("tr");

                  // Floor Cell
                  row.innerHTML += `<td class="border border-slate-300 p-2 font-bold text-center bg-slate-50">${floor} (${task.shortName || task.name})</td>`;

                  let completedCount = 0;

                  // Room Cells
                  for (let room = 1; room <= CONFIG.MAX_ROOMS; room++) {
                    if (floor === 2 && room > CONFIG.getRoomsOnFloor(2)) {
                      row.innerHTML += `<td class="border border-slate-300 p-1 bg-slate-100"></td>`;
                      continue;
                    }

                    const unitData = projectData[catKey]?.[floor]?.[room] || {};
                    let cellContent = "";
                    let cellClass = "bg-white";

                    if (catDef.type === "inspection") {
                      const score = unitData.qcScore || unitData.cmScore || 0;
                      const isDefect =
                        unitData.qcHasMajorDefect || unitData.cmHasMajorDefect;
                      if (score > 0) {
                        if (score >= 85) {
                          cellClass = isDefect
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"; // Pass but defect vs Pass Clean
                          cellContent = isDefect ? "!" : "✓";
                          completedCount++;
                        } else {
                          cellClass = "bg-red-100 text-red-800";
                          cellContent = "✗";
                        }
                      }
                    } else if (catDef.type === "multi-progress") {
                      if (task.condition && !task.condition(floor, room)) {
                        cellClass = "bg-slate-50 text-slate-300";
                        cellContent = "N/A";
                      } else {
                        const progress = unitData[`progress_${task.key}`] || 0;
                        if (progress >= 100) {
                          cellClass = "bg-green-500 text-white";
                          cellContent = "100%";
                          completedCount++;
                        } else if (progress > 0) {
                          cellClass = "bg-blue-100 text-blue-800";
                          cellContent = `${progress}%`;
                        }
                      }
                    } else {
                      // Sequential
                      const currentTaskIndex = unitData.taskIndex || 0;
                      const progress = unitData.progress || 0;

                      if (
                        currentTaskIndex > taskIndex ||
                        (currentTaskIndex === taskIndex && progress >= 100)
                      ) {
                        cellClass = "bg-green-500 text-white";
                        cellContent = "100%";
                        completedCount++;
                      } else if (
                        currentTaskIndex === taskIndex &&
                        progress > 0
                      ) {
                        cellClass = "bg-blue-100 text-blue-800";
                        cellContent = `${progress}%`;
                      }
                    }

                    row.innerHTML += `<td class="border border-slate-300 p-1 text-center text-[10px] ${cellClass}">${cellContent}</td>`;
                  }

                  // Summary Cell
                  const totalRooms = roomsOnThisFloor;
                  const percent = Math.round(
                    (completedCount / totalRooms) * 100,
                  );
                  row.innerHTML += `<td class="border border-slate-300 p-2 text-center font-bold text-slate-700">${percent}%</td>`;

                  tbody.appendChild(row);
                });
              });
              table.appendChild(tbody);
              pdfContainer.appendChild(table);
            }
          });

          // Generate PDF
          const btn = document.getElementById("generatePDFReportBtn");
          const originalText = btn.innerHTML;
          btn.innerHTML = "กำลังสร้าง PDF...";
          btn.disabled = true;

          setTimeout(() => {
            html2canvas(pdfContainer, {
              scale: 2, // High quality
              useCORS: true,
              backgroundColor: "#ffffff",
            })
              .then((canvas) => {
                const imgData = canvas.toDataURL("image/png");
                const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
                if (!jsPDF) {
                    throw new Error("jsPDF library not loaded");
                }
                const pdf = new jsPDF(isLandscape ? "l" : "p", "mm", "a4");

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                const imgProps = pdf.getImageProperties(imgData);
                const imgWidth = pdfWidth;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                // Handle multi-page if height exceeds page height
                if (imgHeight > pdfHeight) {
                  let heightLeft = imgHeight;
                  let position = 0;

                  pdf.addImage(
                    imgData,
                    "PNG",
                    0,
                    position,
                    imgWidth,
                    imgHeight,
                  );
                  heightLeft -= pdfHeight;

                  while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(
                      imgData,
                      "PNG",
                      0,
                      position,
                      imgWidth,
                      imgHeight,
                    );
                    heightLeft -= pdfHeight;
                  }
                } else {
                  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
                }

                pdf.save(`report-${Date.now()}.pdf`);
              })
              .catch((err) => {
                console.error("PDF Generation Error:", err);
                showNotificationModal(
                  "เกิดข้อผิดพลาด",
                  "ไม่สามารถสร้าง PDF ได้",
                );
              })
              .finally(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                // Clean up container? No, keep it for debugging or next use, it's hidden.
              });
          }, 500);
        }

        // --- AI & REPORTING FUNCTIONS ---
        function setupAndOpenReportModal(triggerElement) {
          renderReportUI();
          openModal("reportModal", triggerElement);
        }

        function renderReportUI() {
          const reportContentArea = document.getElementById(
            "report-content-area",
          );

          const controlsHTML = `
                    <div class="xl:col-span-1 flex flex-col gap-8 pr-2">
                        <!-- Section 1 -->
                        <div class="flex flex-col gap-3">
                             <div class="flex justify-between items-center">
                                 <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                                     <span class="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                     เลือกและจัดลำดับงาน
                                 </h3>
                                 <div class="flex gap-2 bg-slate-100 p-1 rounded-lg">
                                     <button id="selectAllTasksBtn" class="text-[11px] px-2 py-1 rounded-md text-slate-600 hover:bg-white hover:shadow-sm hover:text-indigo-600 font-medium transition-all">เลือกทั้งหมด</button>
                                     <button id="deselectAllTasksBtn" class="text-[11px] px-2 py-1 rounded-md text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-800 font-medium transition-all">ล้าง</button>
                                 </div>
                             </div>
                             <div id="report-task-list-container" class="bg-slate-50/50 rounded-2xl p-2 border border-slate-100"></div>
                        </div>

                        <!-- Section 2 -->
                        <div class="flex flex-col gap-3">
                             <div class="flex justify-between items-center">
                                 <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                                     <span class="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                     เลือกชั้นที่ต้องการ
                                 </h3>
                                 <div class="flex gap-2 bg-slate-100 p-1 rounded-lg">
                                     <button id="selectAllFloorsBtn" class="text-[11px] px-2 py-1 rounded-md text-slate-600 hover:bg-white hover:shadow-sm hover:text-indigo-600 font-medium transition-all">เลือกทั้งหมด</button>
                                     <button id="deselectAllFloorsBtn" class="text-[11px] px-2 py-1 rounded-md text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-800 font-medium transition-all">ล้าง</button>
                                 </div>
                             </div>
                              <div id="report-floor-list-container" class="bg-slate-50/50 rounded-2xl p-3 border border-slate-100"></div>
                        </div>

                        <!-- Section 3 -->
                        <div class="flex flex-col gap-3">
                             <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                                 <span class="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                                 ตัวเลือกเพิ่มเติม
                             </h3>
                              <div id="report-options-container"></div>
                        </div>
                    </div>
                `;

          const outputHTML = `
                    <div class="xl:col-span-2 flex flex-col xl:border-l xl:border-slate-200 xl:pl-8 min-h-0">
                        <div class="flex flex-col gap-5 h-full">
                            <!-- Tabs -->
                            <div id="report-type-toggle" class="bg-slate-100/80 p-1.5 rounded-xl text-slate-600 text-sm font-semibold flex shadow-inner border border-slate-200/50">
                                <button id="toggle-simple-report" class="report-type-toggle-btn flex-1 px-4 py-2.5 rounded-lg active transition-all flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    สร้างรายงานปกติ
                                </button>
                                <button id="toggle-ai-report" class="report-type-toggle-btn flex-1 px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg>
                                    สร้างด้วย AI
                                </button>
                            </div>

                            <!-- Simple Report View -->
                            <div id="simple-report-view" class="flex flex-col gap-4">
                                 <button id="generateRawReportBtn" class="w-full px-4 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm flex items-center justify-center gap-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                     สร้างรายงาน
                                 </button>
                            </div>

                            <!-- AI Report View -->
                            <div id="ai-report-view" class="hidden flex-col gap-4">
                                <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-2xl p-5 shadow-sm">
                                    <p class="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg>
                                        เลือกรูปแบบรายงาน AI
                                    </p>
                                    <div class="grid grid-cols-2 gap-3">
                                         <button id="generateAITextBtn" class="w-full px-4 py-3 bg-white border border-indigo-200 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm flex items-center justify-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                            แบบข้อความ
                                         </button>
                                         <button id="generateAIInfographicBtn" class="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 hover:shadow-md transition-all shadow-sm flex items-center justify-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                                            แบบ Infographic
                                         </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Shared Output Area -->
                            <div class="relative flex-grow min-h-0 border border-slate-200 rounded-2xl bg-slate-50/30 shadow-inner overflow-hidden flex flex-col">
                                <div id="ai-loading-overlay" class="absolute inset-0 items-center justify-center hidden bg-white/90 backdrop-blur-sm z-10">
                                    <div class="text-center p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 transform transition-all">
                                        <div class="spinner mx-auto mb-5 border-indigo-100 border-t-indigo-600"></div>
                                        <p class="font-bold text-indigo-800 text-lg">กำลังประมวลผล...</p>
                                        <p class="text-sm text-slate-500 mt-2">AI กำลังวิเคราะห์และจัดทำรายงาน</p>
                                    </div>
                                </div>
                                <div class="bg-slate-100/50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">ผลลัพธ์</span>
                                </div>
                                <textarea id="ai-output-text" class="w-full h-full p-5 bg-transparent text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 custom-scrollbar" placeholder="ผลลัพธ์จะแสดงที่นี่..."></textarea>
                                <div id="ai-output-infographic" class="hidden p-5 bg-white h-full overflow-auto custom-scrollbar"></div>
                            </div>

                            <!-- Actions -->
                            <div id="report-actions" class="flex-shrink-0 flex gap-3 pt-1">
                                 <button id="copyReportBtn" class="flex-grow py-3.5 px-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm inline-flex items-center justify-center gap-2" title="คัดลอกสรุป">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                                     <span>คัดลอกผลลัพธ์</span>
                                 </button>
                                 <button id="downloadInfographicBtn" class="flex-grow py-3.5 px-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 hover:shadow-md transition-all shadow-sm inline-flex items-center justify-center gap-2 hidden" title="ดาวน์โหลด Infographic">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
                                    <span>ดาวน์โหลดเป็นรูปภาพ</span>
                                 </button>
                            </div>
                        </div>
                    </div>
                `;

          reportContentArea.innerHTML = controlsHTML + outputHTML;

          bindReportButtonListeners();
          populateReportUI();
        }

        function bindReportButtonListeners() {
          // Main Toggles
          const simpleToggle = document.getElementById("toggle-simple-report");
          const aiToggle = document.getElementById("toggle-ai-report");

          const simpleView = document.getElementById("simple-report-view");
          const aiView = document.getElementById("ai-report-view");

          function setActiveView(viewName) {
            // Reset all
            simpleToggle.classList.remove("active");
            aiToggle.classList.remove("active");

            simpleView.classList.add("hidden");
            aiView.classList.add("hidden");

            // Set active
            if (viewName === "simple") {
              simpleToggle.classList.add("active");
              simpleView.classList.remove("hidden");
            } else if (viewName === "ai") {
              aiToggle.classList.add("active");
              aiView.classList.remove("hidden");
            }
          }

          simpleToggle.addEventListener("click", () => setActiveView("simple"));
          aiToggle.addEventListener("click", () => setActiveView("ai"));

          // Action Buttons
          document
            .getElementById("generateRawReportBtn")
            ?.addEventListener("click", handleGenerateRawReport);
          document
            .getElementById("generateAITextBtn")
            ?.addEventListener("click", handleGenerateAITextReport);
          document
            .getElementById("generateAIInfographicBtn")
            ?.addEventListener("click", handleGenerateAIInfographic);
          document
            .getElementById("copyReportBtn")
            ?.addEventListener("click", () =>
              copyToClipboard("ai-output-text", "copyReportBtn"),
            );
          document
            .getElementById("downloadInfographicBtn")
            ?.addEventListener("click", () =>
              downloadInfographic(
                "ai-output-infographic",
                "downloadInfographicBtn",
              ),
            );
        }

        function populateReportUI() {
          const checkIconSVG = `<svg class="icon w-3.5 h-3.5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;
          const dragIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300 mr-3 flex-shrink-0 cursor-grab active:cursor-grabbing hover:text-slate-500 transition-colors"><circle cx="9" cy="12" r="1.5"></circle><circle cx="9" cy="5" r="1.5"></circle><circle cx="9" cy="19" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle><circle cx="15" cy="5" r="1.5"></circle><circle cx="15" cy="19" r="1.5"></circle></svg>`;

          const taskContainer = document.getElementById(
            "report-task-list-container",
          );
          let tasksHTML =
            '<div class="task-list-sortable-container space-y-2 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">';
          Object.keys(taskDefinitions).forEach((catKey) => {
            const catDef = taskDefinitions[catKey];
            const mainCheckboxId = `report-main-task-${catKey}`;
            tasksHTML += `
                        <div class="report-main-task-container bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden" draggable="true">
                            <input type="checkbox" id="${mainCheckboxId}" data-catkey="${catKey}" class="hidden report-main-task-checkbox">
                            <label for="${mainCheckboxId}" class="report-selection-label font-semibold text-slate-700 py-3 px-4 w-full flex items-center cursor-pointer">
                                ${dragIconSVG}
                                <span class="box bg-white border-2 border-slate-300 rounded-lg w-5 h-5 flex items-center justify-center mr-3 transition-colors shadow-sm">${checkIconSVG}</span>
                                <span class="text-[15px] flex items-center gap-2"><span class="text-lg">${catDef.reportEmoji}</span> ${catDef.reportName}</span>
                            </label>
                            <div id="subtasks-${catKey}" class="hidden pl-14 pr-4 pb-3 space-y-1.5 mt-1 border-t border-slate-100 pt-3">`;

            if (
              catDef.type === "progress" ||
              catDef.type === "multi-progress"
            ) {
              catDef.tasks.forEach((task, index) => {
                const id = `report-subtask-${catKey}-${index}`;
                tasksHTML += `<div><input type="checkbox" id="${id}" data-catkey="${catKey}" data-taskidx="${index}" class="hidden report-subtask-checkbox"><label for="${id}" class="report-selection-label text-sm text-slate-600 py-2 px-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors w-full flex items-center cursor-pointer"><span class="box bg-white border-2 border-slate-300 rounded w-4 h-4 flex items-center justify-center mr-3 transition-colors">${checkIconSVG}</span><span>${task.name}</span></label></div>`;
              });
            } else {
              const id = `report-subtask-${catKey}-summary`;
              tasksHTML += `<div><input type="checkbox" id="${id}" data-catkey="${catKey}" data-taskidx="0" class="hidden report-subtask-checkbox"><label for="${id}" class="report-selection-label text-sm text-slate-600 py-2 px-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors w-full flex items-center cursor-pointer"><span class="box bg-white border-2 border-slate-300 rounded w-4 h-4 flex items-center justify-center mr-3 transition-colors">${checkIconSVG}</span><span>สรุปผลตรวจ</span></label></div>`;
            }

            tasksHTML += `</div></div>`;
          });
          tasksHTML += "</div>";
          taskContainer.innerHTML = tasksHTML;

          const floorContainer = document.getElementById(
            "report-floor-list-container",
          );
          let floorsHTML = '<div class="flex flex-wrap gap-2 px-1">';
          CONFIG.FLOORS.slice()
            .reverse()
            .forEach((floor) => {
              const id = `report-floor-${floor}`;
              floorsHTML += `<div><input type="checkbox" id="${id}" value="${floor}" class="hidden report-floor-checkbox"><label for="${id}" class="floor-selector-btn bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-sm cursor-pointer">${floor}</label></div>`;
            });
          floorsHTML += "</div>";
          floorContainer.innerHTML = floorsHTML;

          const optionsContainer = document.getElementById(
            "report-options-container",
          );
          optionsContainer.innerHTML = `<div class="border border-slate-200 rounded-2xl p-5 space-y-5 bg-white shadow-sm">
                    <div>
                        <input type="checkbox" id="report-include-summary" class="hidden">
                        <label for="report-include-summary" class="report-selection-label text-slate-700 font-medium flex items-center cursor-pointer group">
                            <span class="box bg-white border-2 border-slate-300 rounded-lg w-5 h-5 flex items-center justify-center mr-3 transition-colors shadow-sm group-hover:border-indigo-400">${checkIconSVG}</span>
                            <span>แสดงภาพรวมทั้งโครงการ</span>
                        </label>
                    </div>
                    <div class="pt-2 border-t border-slate-100">
                        <p class="text-sm font-semibold text-slate-600 mb-3 px-1">รูปแบบรายงาน:</p>
                        <div class="report-toggle-container flex w-full bg-slate-100 rounded-xl p-1.5 shadow-inner border border-slate-200/50">
                            <input type="radio" id="report-type-short" name="report-type" value="short" class="hidden">
                            <label for="report-type-short" class="flex-1 text-center py-2.5 rounded-lg cursor-pointer transition-all text-sm font-semibold text-slate-600 hover:text-slate-800">แบบสั้น</label>
                            <input type="radio" id="report-type-long" name="report-type" value="long" class="hidden" checked>
                            <label for="report-type-long" class="flex-1 text-center py-2.5 rounded-lg cursor-pointer transition-all text-sm font-semibold text-slate-600 hover:text-slate-800">แบบยาว</label>
                        </div>
                    </div>
                    <div id="room-summary-option-container" class="border-t border-slate-100 pt-4 mt-2 hidden">
                         <h4 class="font-semibold text-slate-800 mb-3">สรุปคะแนนรายห้อง</h4>
                         <div>
                             <input type="checkbox" id="report-room-summary" class="hidden">
                             <label for="report-room-summary" class="report-selection-label text-slate-700 font-medium flex items-center cursor-pointer group">
                                  <span class="box bg-white border-2 border-slate-300 rounded-lg w-5 h-5 flex items-center justify-center mr-3 transition-colors shadow-sm group-hover:border-indigo-400">${checkIconSVG}</span><span>แนบสรุปคะแนน (รวมทุกผลตรวจ)</span>
                             </label>
                         </div>
                    </div>
                    <div id="detailed-grid-option-container" class="border-t border-slate-100 pt-4 mt-2 hidden">
                         <h4 class="font-semibold text-slate-800 mb-3">รูปแบบตารางละเอียด</h4>
                         <div>
                             <input type="checkbox" id="report-detailed-grid" class="hidden">
                             <label for="report-detailed-grid" class="report-selection-label text-slate-700 font-medium flex items-center cursor-pointer group">
                                  <span class="box bg-white border-2 border-slate-300 rounded-lg w-5 h-5 flex items-center justify-center mr-3 transition-colors shadow-sm group-hover:border-indigo-400">${checkIconSVG}</span><span>ใช้ตารางแบบละเอียด (Grid) สำหรับงานประตู/กระเบื้อง</span>
                             </label>
                         </div>
                    </div>
                </div>`;

          document
            .querySelectorAll(".report-main-task-checkbox")
            .forEach((checkbox) => {
              checkbox.addEventListener("change", (e) => {
                const catKey = e.target.dataset.catkey;
                const subtasksDiv = document.getElementById(
                  `subtasks-${catKey}`,
                );
                const subtaskCheckboxes = subtasksDiv.querySelectorAll(
                  ".report-subtask-checkbox",
                );
                if (e.target.checked) {
                  subtasksDiv.classList.remove("hidden");
                  subtaskCheckboxes.forEach((cb) => (cb.checked = true));
                } else {
                  subtasksDiv.classList.add("hidden");
                  subtaskCheckboxes.forEach((cb) => (cb.checked = false));
                }
                updateRoomSummaryVisibility();
                updateDetailedGridVisibility();
              });
            });

          document
            .getElementById("selectAllTasksBtn")
            .addEventListener("click", () =>
              document
                .querySelectorAll(".report-main-task-checkbox")
                .forEach((cb) => {
                  if (!cb.checked) cb.click();
                }),
            );
          document
            .getElementById("deselectAllTasksBtn")
            .addEventListener("click", () =>
              document
                .querySelectorAll(".report-main-task-checkbox")
                .forEach((cb) => {
                  if (cb.checked) cb.click();
                }),
            );
          document
            .getElementById("selectAllFloorsBtn")
            .addEventListener("click", () =>
              document
                .querySelectorAll(".report-floor-checkbox")
                .forEach((cb) => (cb.checked = true)),
            );
          document
            .getElementById("deselectAllFloorsBtn")
            .addEventListener("click", () =>
              document
                .querySelectorAll(".report-floor-checkbox")
                .forEach((cb) => (cb.checked = false)),
            );

          const sortableList = document.querySelector(
            ".task-list-sortable-container",
          );
          const draggables = sortableList.querySelectorAll(
            ".report-main-task-container",
          );

          draggables.forEach((draggable) => {
            draggable.addEventListener("dragstart", () =>
              draggable.classList.add("dragging"),
            );
            draggable.addEventListener("dragend", () =>
              draggable.classList.remove("dragging"),
            );
          });

          sortableList.addEventListener("dragover", (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(sortableList, e.clientY);
            const draggingElement = document.querySelector(".dragging");
            if (draggingElement) {
              if (afterElement == null) {
                sortableList.appendChild(draggingElement);
              } else {
                sortableList.insertBefore(draggingElement, afterElement);
              }
            }
          });
          updateDetailedGridVisibility();
          updateRoomSummaryVisibility();
        }

        function updateRoomSummaryVisibility() {
          const container = document.getElementById(
            "room-summary-option-container",
          );
          const isInspectionSelected = Array.from(
            document.querySelectorAll(".report-main-task-checkbox:checked"),
          ).some(
            (cb) => taskDefinitions[cb.dataset.catkey].type === "inspection",
          );
          container.classList.toggle("hidden", !isInspectionSelected);
        }

        function updateDetailedGridVisibility() {
          const container = document.getElementById(
            "detailed-grid-option-container",
          );
          const isMultiProgressSelected = Array.from(
            document.querySelectorAll(".report-main-task-checkbox:checked"),
          ).some(
            (cb) =>
              taskDefinitions[cb.dataset.catkey].type === "multi-progress",
          );
          container.classList.toggle("hidden", !isMultiProgressSelected);
        }

        function getDragAfterElement(container, y) {
          const draggableElements = [
            ...container.querySelectorAll(
              ".report-main-task-container:not(.dragging)",
            ),
          ];
          return draggableElements.reduce(
            (closest, child) => {
              const box = child.getBoundingClientRect();
              const offset = y - box.top - box.height / 2;
              return offset < 0 && offset > closest.offset
                ? { offset, element: child }
                : closest;
            },
            { offset: Number.NEGATIVE_INFINITY },
          ).element;
        }

        function calculateMultiProgressOverallStatus(
          categoryKey,
          floorsToCalc,
          selectedSubTaskIndexes,
        ) {
          let completedRooms = 0,
            inProgressRooms = 0,
            totalRooms = 0;
          const catDef = taskDefinitions[categoryKey];
          const relevantTasks = selectedSubTaskIndexes.map(
            (idx) => catDef.tasks[idx],
          );
          const relevantTaskKeys = relevantTasks.map((t) => t.key);

          floorsToCalc.forEach((floor) => {
            const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
            for (let room = 1; room <= roomsOnThisFloor; room++) {
              let isApplicable = false;
              relevantTasks.forEach((t) => {
                if (!t.condition || t.condition(floor, room))
                  isApplicable = true;
              });
              if (!isApplicable) continue;
              totalRooms++;

              const unitData = projectData[categoryKey][floor][room];
              let isRoomComplete = relevantTaskKeys.every(
                (taskKey) => (unitData[`progress_${taskKey}`] || 0) >= 100,
              );
              let isRoomInProgress =
                !isRoomComplete &&
                relevantTaskKeys.some(
                  (taskKey) => (unitData[`progress_${taskKey}`] || 0) > 0,
                );
              if (isRoomComplete) completedRooms++;
              else if (isRoomInProgress) inProgressRooms++;
            }
          });
          return { completedRooms, inProgressRooms, totalRooms };
        }

        function calculateMultiProgressOverallPercentage(
          categoryKey,
          floorsToCalc,
          selectedSubTaskIndexes,
        ) {
          let totalProgress = 0,
            totalUnitsInvolved = 0;
          const catDef = taskDefinitions[categoryKey];
          const relevantTasks = selectedSubTaskIndexes.map(
            (idx) => catDef.tasks[idx],
          );
          const relevantTaskKeys = relevantTasks.map((t) => t.key);

          floorsToCalc.forEach((floor) => {
            const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
            for (let room = 1; room <= roomsOnThisFloor; room++) {
              let isApplicable = false;
              relevantTasks.forEach((t) => {
                if (!t.condition || t.condition(floor, room))
                  isApplicable = true;
              });
              if (!isApplicable) continue;
              totalUnitsInvolved++;

              let roomTotalProgress = relevantTaskKeys.reduce(
                (sum, taskKey) =>
                  sum +
                  (projectData[categoryKey][floor][room][
                    `progress_${taskKey}`
                  ] || 0),
                0,
              );
              totalProgress += roomTotalProgress / relevantTaskKeys.length;
            }
          });
          const maxProgress = totalUnitsInvolved * 100;
          return maxProgress > 0 ? (totalProgress / maxProgress) * 100 : 0;
        }

        function calculateSubTaskProgress(
          categoryKey,
          subTaskIndex,
          floorsToCalc,
        ) {
          let totalProgress = 0,
            totalUnitsInvolved = 0;
          const catDef = taskDefinitions[categoryKey];

          floorsToCalc.forEach((floor) => {
            const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
            for (let room = 1; room <= roomsOnThisFloor; room++) {
              let isApplicable = true;
              if (catDef.type === "multi-progress") {
                const task = catDef.tasks[subTaskIndex];
                if (task.condition && !task.condition(floor, room))
                  isApplicable = false;
              }
              if (!isApplicable) continue;
              totalUnitsInvolved++;

              const unitData = projectData[categoryKey][floor][room];
              if (catDef.type === "multi-progress") {
                const taskKey = catDef.tasks[subTaskIndex].key;
                totalProgress += unitData[`progress_${taskKey}`] || 0;
              } else {
                if ((unitData.taskIndex || 0) > subTaskIndex)
                  totalProgress += 100;
                else if ((unitData.taskIndex || 0) === subTaskIndex)
                  totalProgress += unitData.progress || 0;
              }
            }
          });
          const maxProgress = totalUnitsInvolved * 100;
          return maxProgress > 0 ? (totalProgress / maxProgress) * 100 : 0;
        }

        function calculateSubTaskStatusCounts(
          categoryKey,
          subTaskIndex,
          floorsToCalc,
        ) {
          let completedRooms = 0,
            inProgressRooms = 0,
            totalRooms = 0;
          const catDef = taskDefinitions[categoryKey];

          floorsToCalc.forEach((floor) => {
            const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
            for (let room = 1; room <= roomsOnThisFloor; room++) {
              let isApplicable = true;
              if (catDef.type === "multi-progress") {
                const task = catDef.tasks[subTaskIndex];
                if (task.condition && !task.condition(floor, room))
                  isApplicable = false;
              }
              if (!isApplicable) continue;
              totalRooms++;

              const unitData = projectData[categoryKey][floor][room];
              let isCompleted, isInProgress;
              if (catDef.type === "multi-progress") {
                const progress =
                  unitData[`progress_${catDef.tasks[subTaskIndex].key}`] || 0;
                isCompleted = progress >= 100;
                isInProgress = progress > 0 && progress < 100;
              } else {
                isCompleted =
                  (unitData.taskIndex || 0) > subTaskIndex ||
                  ((unitData.taskIndex || 0) === subTaskIndex &&
                    (unitData.progress || 0) >= 100);
                isInProgress =
                  (unitData.taskIndex || 0) === subTaskIndex &&
                  (unitData.progress || 0) > 0 &&
                  (unitData.progress || 0) < 100;
              }
              if (isCompleted) completedRooms++;
              else if (isInProgress) inProgressRooms++;
            }
          });
          return { completedRooms, inProgressRooms, totalRooms };
        }

        function calculateInspectionStats(categoryKey, stage, floorsToCalc) {
          let submitted = 0,
            passed_clean = 0,
            passed_defect = 0,
            failed_clean = 0,
            failed_defect = 0,
            inInspection = 0;
          let totalRooms = 0;
          const scoreField = stage === "CM" ? "cmScore" : "qcScore";
          const defectField =
            stage === "CM" ? "cmHasMajorDefect" : "qcHasMajorDefect";
          floorsToCalc.forEach((floor) => {
            const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
            totalRooms += roomsOnThisFloor;
            for (let room = 1; room <= roomsOnThisFloor; room++) {
              const unitData = projectData[categoryKey][floor][room];
              if (unitData.inInspection) {
                inInspection++;
              }
              if (unitData[scoreField] > 0) {
                submitted++;
                if (unitData[scoreField] >= 85) {
                  if (unitData[defectField]) passed_defect++;
                  else passed_clean++;
                } else {
                  if (unitData[defectField]) failed_defect++;
                  else failed_clean++;
                }
              }
            }
          });
          return {
            submitted,
            passed_clean,
            passed_defect,
            failed_clean,
            failed_defect,
            totalRooms,
            inInspection,
          };
        }

        async function runAIAnalysis(request, renderer) {
          const loadingOverlay = document.getElementById("ai-loading-overlay");

          loadingOverlay.style.display = "flex";
          document.getElementById("ai-output-text").value =
            "AI กำลังประมวลผล...";
          document.getElementById("ai-output-infographic").innerHTML = "";

          if (!ai) {
            showNotificationModal(
              "AI ไม่พร้อมใช้งาน",
              "ไม่สามารถเริ่มต้นระบบ AI ได้ กรุณาตรวจสอบการตั้งค่า API Key",
            );
            loadingOverlay.style.display = "none";
            return;
          }

          let retries = 5;
          let delay = 1000;

          for (let i = 0; i < retries; i++) {
            try {
              const response = await ai.models.generateContent(request);
              renderer(response.text);
              loadingOverlay.style.display = "none";
              return; // Success
            } catch (error) {
              if (i === retries - 1) {
                console.error(
                  "AI Analysis Error after multiple retries:",
                  error,
                );
                const errorMessage = `เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: ${error.message}`;
                showNotificationModal("AI Error", errorMessage);
                document.getElementById("ai-output-text").value = errorMessage;
                switchToTextView();
                loadingOverlay.style.display = "none";
                return;
              }
              console.warn(
                `An error occurred. Retrying in ${delay / 1000}s...`,
                error.message,
              );
            }

            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          }
        }

        function switchToTextView() {
          document.getElementById("ai-output-text").classList.remove("hidden");
          document
            .getElementById("ai-output-infographic")
            .classList.add("hidden");
          document.getElementById("copyReportBtn").classList.remove("hidden");
          document
            .getElementById("downloadInfographicBtn")
            .classList.add("hidden");
        }

        function switchToInfographicView() {
          document.getElementById("ai-output-text").classList.add("hidden");
          document
            .getElementById("ai-output-infographic")
            .classList.remove("hidden");
          document.getElementById("copyReportBtn").classList.add("hidden");
          document
            .getElementById("downloadInfographicBtn")
            .classList.remove("hidden");
        }

        function handleGenerateRawReport() {
          const rawReportText =
            currentView === "common"
              ? prepareCommonAreaReportText()
              : prepareRawReportText();
          if (rawReportText) {
            switchToTextView();
            document.getElementById("ai-output-text").value =
              rawReportText.replace(/\*/g, "");
            showToast("สร้างรายงานสำเร็จ");
          }
        }

        function handleGenerateAITextReport() {
          const rawReportText =
            currentView === "common"
              ? prepareCommonAreaReportText()
              : prepareRawReportText();
          if (!rawReportText) return;

          switchToTextView();
          const request = {
            model: CONFIG.GEMINI_API_MODEL,
            contents: [{ parts: [{ text: rawReportText }] }],
            config: {
              systemInstruction:
                "คุณคือผู้จัดการโครงการที่ต้องรายงานความคืบหน้าในกลุ่ม LINE อย่างเป็นทางการและมีความเป็นมืออาชีพสูง จงสรุปข้อมูลต่อไปนี้ให้กระชับ ชัดเจน ห้ามใช้ Markdown formatting เช่น `**` หรือ `*` และห้ามลงท้ายด้วย 'ครับ' หรือ 'ค่ะ' ใช้ emoji ช่วยเน้นประเด็นสำคัญ และจัดรูปแบบให้อ่านง่ายในแอปพลิเคชันแชท สำหรับงานประตู งานอลูมิเนียม และงานกระเบื้อง ให้สรุปรายละเอียดจำนวนบาน/ห้องที่แล้วเสร็จจากจำนวนทั้งหมด และจำนวนที่กำลังดำเนินการอย่างชัดเจน เช่น '- ประตูหน้า: แล้วเสร็จ 10/20 บาน, กำลังดำเนินการ 5 บาน'",
            },
          };
          runAIAnalysis(request, (text) => {
            document.getElementById("ai-output-text").value = text;
          });
        }

        function handleGenerateAIInfographic() {
          const rawReportText =
            currentView === "common"
              ? prepareCommonAreaReportText()
              : prepareRawReportText();
          if (!rawReportText) return;

          switchToInfographicView();
          const today = new Date();
          const dateString = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() + 543}`;

          const request = {
            model: CONFIG.GEMINI_API_MODEL,
            contents: [
              {
                parts: [
                  {
                    text: `จากข้อมูลรายงานความคืบหน้าโครงการ PYNN NGAMWONGWAN 54:\n---\n${rawReportText}\n---`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction:
                "คุณคือผู้ช่วยวิเคราะห์โครงการก่อสร้างมืออาชีพ หน้าที่ของคุณคือแปลงข้อมูลความคืบหน้าดิบให้เป็นข้อมูลสรุปสำหรับ Infographic ตาม schema ที่กำหนดอย่างเคร่งครัด โดยวิเคราะห์หาประเด็นสำคัญในแต่ละหัวข้อ: งานที่คืบหน้าดี, จุดที่ต้องให้ความสำคัญ, และแผนงาน/ข้อเสนอแนะที่นำไปปฏิบัติได้จริง",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  infographicData: {
                    type: Type.OBJECT,
                    properties: {
                      reportTitle: {
                        type: Type.STRING,
                        description:
                          "ชื่อรายงานสรุปที่เหมาะสมกับงานที่เลือก เช่น 'สรุปความคืบหน้างานสกิมและทาสี'",
                      },
                      reportDate: {
                        type: Type.STRING,
                        description: `วันที่ของรายงาน, คือ '${dateString}'`,
                      },
                      executiveSummary: {
                        type: Type.STRING,
                        description:
                          "สรุปภาพรวมทั้งหมด 1-2 ประโยคที่กระชับที่สุด",
                      },
                      overallProgress: {
                        type: Type.NUMBER,
                        description:
                          "คำนวณค่าเฉลี่ยความคืบหน้าของ 'ทุกงานที่เลือก' รวมกันเป็นตัวเลข 0-100",
                      },
                      keyMetrics: {
                        type: Type.ARRAY,
                        description:
                          "สร้าง Key Metrics ที่สำคัญ 4 อย่างจากข้อมูลที่ให้มา",
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            label: { type: Type.STRING },
                            value: { type: Type.STRING },
                          },
                        },
                      },
                      progressingWell: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "ลิสต์ของงานหรือพื้นที่ที่คืบหน้าได้ดี",
                      },
                      areasOfConcern: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description:
                          "ลิสต์ของปัญหาหรือความเสี่ยงที่สำคัญที่ต้องให้ความสนใจ",
                      },
                      recommendations: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description:
                          "ลิสต์ของแผนงานหรือข้อเสนอแนะที่ควรทำต่อไป",
                      },
                    },
                  },
                },
              },
            },
          };

          runAIAnalysis(request, (jsonText) => {
            try {
              const aiData = JSON.parse(jsonText);
              renderInfographic(aiData.infographicData);
            } catch (e) {
              console.error("Failed to parse AI JSON response:", e);
              switchToTextView();
              document.getElementById("ai-output-text").value =
                `เกิดข้อผิดพลาดในการอ่านข้อมูลจาก AI: ${e.message}\n\n${jsonText}`;
            }
          });
        }

        function getReportSelections() {
          const selections = {
            orderedTaskKeys: [],
            tasks: {},
            floors: Array.from(
              document.querySelectorAll(".report-floor-checkbox:checked"),
            ).map((el) => parseInt(el.value, 10)),
            includeSummary: document.getElementById("report-include-summary")
              .checked,
            reportType: document.querySelector(
              'input[name="report-type"]:checked',
            ).value,
            includeRoomSummary:
              document.getElementById("report-room-summary")?.checked || false,
          };

          document
            .querySelectorAll(".report-main-task-container")
            .forEach((container) => {
              const mainCheckbox = container.querySelector(
                ".report-main-task-checkbox",
              );
              if (mainCheckbox && mainCheckbox.checked) {
                const catKey = mainCheckbox.dataset.catkey;
                selections.orderedTaskKeys.push(catKey);
                const subtasksDiv = document.getElementById(
                  `subtasks-${catKey}`,
                );
                selections.tasks[catKey] = Array.from(
                  subtasksDiv.querySelectorAll(
                    ".report-subtask-checkbox:checked",
                  ),
                ).map((sub) => parseInt(sub.dataset.taskidx, 10));
              }
            });

          selections.floors.sort((a, b) => a - b);
          return selections;
        }

        function prepareRawReportText() {
          const selections = getReportSelections();
          const {
            orderedTaskKeys,
            tasks,
            floors,
            includeSummary,
            reportType,
            includeRoomSummary,
          } = selections;

          if (
            orderedTaskKeys.length === 0 ||
            (!floors.length && !includeSummary)
          ) {
            showNotificationModal(
              "ข้อมูลไม่เพียงพอ",
              "กรุณาเลือก 'งาน' และ 'ชั้น' (หรือ 'ภาพรวมทั้งโครงการ') ที่ต้องการสรุปเป็นอย่างน้อย",
            );
            return null;
          }

          const today = new Date();
          const dateString = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() + 543}`;
          let report = `📋 รายงานความก้าวหน้าโครงการ PYNN NGAMWONGWAN 54\n`;
          report += `🗓️ ประจำวันที่ ${dateString}\n`;

          const stripHTML = (html) => html.replace(/<[^>]*>?/gm, "");

          const processCategory = (catKey, floorsToCalc, isSummary) => {
            const catDef = taskDefinitions[catKey];
            let categorySection = `\n${stripHTML(catDef.reportEmoji)} ${catDef.reportName}\n`;
            if (catDef.type === "inspection") {
              let submittedCount = 0;
              let passedCount = 0;
              let failedCount = 0;
              const totalRooms = isSummary
                ? CONFIG.TOTAL_UNITS
                : floorsToCalc.reduce(
                    (acc, f) => acc + CONFIG.getRoomsOnFloor(f),
                    0,
                  );

              floorsToCalc.forEach((floor) => {
                const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
                for (let room = 1; room <= roomsOnThisFloor; room++) {
                  const unitData = projectData[catKey]?.[floor]?.[room] || {};
                  const qcScore = unitData.qcScore || 0;
                  const cmScore = unitData.cmScore || 0;
                  const finalScore = qcScore > 0 ? qcScore : cmScore;

                  if (finalScore > 0) {
                    submittedCount++;
                    if (finalScore >= 85) {
                      passedCount++;
                    } else {
                      failedCount++;
                    }
                  }
                }
              });

              categorySection += `  ภาพรวม (${totalRooms} ห้อง):\n`;
              categorySection += `     • ส่งตรวจแล้ว: ${submittedCount} ห้อง\n`;
              if (reportType === "long") {
                categorySection += `     • ผ่าน: ${passedCount} ห้อง\n`;
                categorySection += `     • ไม่ผ่าน: ${failedCount} ห้อง\n`;
              }
            } else if (catDef.type === "multi-progress") {
              const overallProgress = calculateMultiProgressOverallPercentage(
                catKey,
                floorsToCalc,
                tasks[catKey],
              );
              const stats = calculateMultiProgressOverallStatus(
                catKey,
                floorsToCalc,
                tasks[catKey],
              );
              const total = isSummary ? CONFIG.TOTAL_UNITS : stats.totalRooms;
              let line = `- ภาพรวม: แล้วเสร็จ ${overallProgress.toFixed(1)}%`;
              if (reportType === "long") {
                line += `\n  • ดำเนินการแล้วเสร็จ: ${stats.completedRooms}/${total} ห้อง`;
                if (stats.inProgressRooms > 0)
                  line += `\n  • อยู่ระหว่างดำเนินการ: ${stats.inProgressRooms} ห้อง`;

                // Detailed summaries for specific multi-progress tasks
                if (
                  catKey === "door" ||
                  catKey === "aluminum" ||
                  catKey === "tiling"
                ) {
                  tasks[catKey]
                    .sort((a, b) => a - b)
                    .forEach((taskIdx) => {
                      const subTask = catDef.tasks[taskIdx];
                      let subCompleted = 0;
                      let subInProgress = 0;
                      let subTotal = 0;

                      floorsToCalc.forEach((floor) => {
                        const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
                        for (let room = 1; room <= roomsOnThisFloor; room++) {
                          if (
                            subTask.condition &&
                            !subTask.condition(floor, room)
                          )
                            continue;
                          subTotal++;
                          const unitData =
                            projectData[catKey]?.[floor]?.[room] || {};
                          const progress =
                            unitData[`progress_${subTask.key}`] || 0;
                          if (progress >= 100) {
                            subCompleted++;
                          } else if (progress > 0) {
                            subInProgress++;
                          }
                        }
                      });

                      if (subTotal > 0) {
                        line += `\n    - ${subTask.name}: แล้วเสร็จ ${subCompleted}/${subTotal} บาน, กำลังดำเนินการ ${subInProgress} บาน`;
                      }
                    });
                }
              }
              categorySection += line + "\n";
            } else {
              tasks[catKey]
                .sort((a, b) => a - b)
                .forEach((taskIdx) => {
                  const progress = calculateSubTaskProgress(
                    catKey,
                    taskIdx,
                    floorsToCalc,
                  );
                  const taskName = catDef.tasks[taskIdx].name;
                  let line = `- ${taskName}: แล้วเสร็จ ${progress.toFixed(1)}%`;
                  if (reportType === "long") {
                    const stats = calculateSubTaskStatusCounts(
                      catKey,
                      taskIdx,
                      floorsToCalc,
                    );
                    const total = isSummary
                      ? CONFIG.TOTAL_UNITS
                      : stats.totalRooms;
                    line += `\n  • ดำเนินการแล้วเสร็จ: ${stats.completedRooms}/${total} ห้อง`;
                    if (stats.inProgressRooms > 0)
                      line += `\n  • อยู่ระหว่างดำเนินการ: ${stats.inProgressRooms} ห้อง`;
                  }
                  categorySection += line + "\n";
                });
            }
            return categorySection;
          };

          if (floors.length) {
            floors.forEach((floor) => {
              report += `\n------------------------------------\n`;
              report += `\n🏢 สรุปความคืบหน้า ชั้น ${floor}`;
              orderedTaskKeys.forEach((catKey) => {
                if (tasks[catKey] && tasks[catKey].length > 0)
                  report += processCategory(catKey, [floor], false);
              });
            });
          }

          if (includeSummary) {
            report += `\n------------------------------------\n`;
            report += `\n📊 สรุปภาพรวมความก้าวหน้าทั้งโครงการ`;
            orderedTaskKeys.forEach((catKey) => {
              if (tasks[catKey] && tasks[catKey].length > 0)
                report += processCategory(catKey, CONFIG.FLOORS, true);
            });
          }

          if (includeRoomSummary && floors.length) {
            report += `\n\n------------------------------------\n`;
            report += `\n📋 สรุปคะแนนรายห้อง\n`;
            orderedTaskKeys.forEach((catKey) => {
              const catDef = taskDefinitions[catKey];
              if (
                catDef.type === "inspection" &&
                tasks[catKey] &&
                tasks[catKey].length > 0
              ) {
                report += `\n${stripHTML(catDef.reportEmoji)} ${catDef.reportName}\n`;
                floors.forEach((floor) => {
                  report += `  --- ชั้น ${floor} ---\n`;
                  const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
                  let foundRoom = false;
                  for (let room = 1; room <= roomsOnThisFloor; room++) {
                    const roomNumber = `${floor}${String(room).padStart(2, "0")}`;
                    const unitData = projectData[catKey][floor][room];

                    let score = 0;
                    let defect = false;
                    let stageLabel = "";

                    if (
                      unitData.qcScore > 0 &&
                      unitData.cmScore > 0 &&
                      unitData.qcScore === unitData.cmScore
                    ) {
                      score = unitData.qcScore;
                      defect = unitData.qcHasMajorDefect;
                      stageLabel = "QC-CM";
                    } else if (unitData.qcScore > 0) {
                      score = unitData.qcScore;
                      defect = unitData.qcHasMajorDefect;
                      stageLabel = "QC";
                    } else if (unitData.cmScore > 0) {
                      score = unitData.cmScore;
                      defect = unitData.cmHasMajorDefect;
                      stageLabel = "CM";
                    }

                    if (score > 0) {
                      foundRoom = true;
                      const status = score >= 85 ? "ผ่าน" : "ไม่ผ่าน";
                      const defectText = defect ? " [พบ Major Defect]" : "";
                      report += `    ห้อง ${roomNumber}: ${status} (${score.toFixed(2)}) โดย ${stageLabel}${defectText}\n`;
                    }
                  }
                  if (!foundRoom) {
                    report += "    ไม่มีห้องที่ตรวจแล้ว\n";
                  }
                });
              }
            });
          }

          // Add Notes Section
          let hasNotes = false;
          let notesSection = `\n\n------------------------------------\n\n📝 โน๊ตเพิ่มเติม (Notes)\n`;

          orderedTaskKeys.forEach((catKey) => {
            const catDef = taskDefinitions[catKey];
            let catNotes = "";

            floors.forEach((floor) => {
              const roomsOnThisFloor = CONFIG.getRoomsOnFloor(floor);
              for (let room = 1; room <= roomsOnThisFloor; room++) {
                const roomNumber = `${floor}${String(room).padStart(2, "0")}`;
                const planData =
                  projectData.plans?.[floor]?.[room]?.[catKey] || {};
                if (planData.note) {
                  catNotes += `  • ห้อง ${roomNumber}: ${planData.note}\n`;
                  hasNotes = true;
                }
              }
            });

            if (catNotes) {
              notesSection += `\n${stripHTML(catDef.reportEmoji)} ${catDef.reportName}\n${catNotes}`;
            }
          });

          if (hasNotes) {
            report += notesSection;
          }

          return report.trim();
        }

        function prepareCommonAreaReportText() {
          let report = "ข้อมูลสรุปงานพื้นที่ส่วนกลาง:\n";
          Object.keys(commonAreaDefinitions).forEach((locKey) => {
            const locDef = commonAreaDefinitions[locKey];
            report += `\n- พื้นที่: ${locDef.locationName}\n`;
            locDef.tasks.forEach((task, taskIndex) => {
              report += `  - งาน: ${task.taskName}\n`;
              const taskData = projectData.commonArea[locKey].tasks[taskIndex];
              let floorProgress = [];
              CONFIG.COMMON_AREA_FLOORS.forEach((floor) => {
                const progress = taskData.progress[floor] || 0;
                if (progress > 0) {
                  floorProgress.push(`ชั้น ${floor}: ${progress}%`);
                }
              });
              if (floorProgress.length > 0) {
                report += `    - ความคืบหน้า: ${floorProgress.join(", ")}\n`;
              } else {
                report += `    - ความคืบหน้า: ยังไม่เริ่ม\n`;
              }
            });
          });
          return report.trim();
        }

        function setupAndOpenCommonAreaReportModal(triggerElement) {
          const rawText = prepareCommonAreaReportText();
          const today = new Date();
          const dateString = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() + 543}`;

          const request = {
            model: CONFIG.GEMINI_API_MODEL,
            contents: [
              {
                parts: [
                  {
                    text: `วิเคราะห์และสรุปข้อมูลความคืบหน้าของงานพื้นที่ส่วนกลางโครงการ PYNN NGAMWONGWAN 54:\n---\n${rawText}\n---`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction:
                "คุณคือผู้จัดการโครงการก่อสร้างมืออาชีพ (Project Manager) ที่มีทักษะการวิเคราะห์และสื่อสารเป็นเลิศ หน้าที่ของคุณคือแปลงข้อมูลดิบเกี่ยวกับความคืบหน้าของงานพื้นที่ส่วนกลาง ซึ่งมีโครงสร้างเป็น 'พื้นที่ -> งาน -> ชั้น' ให้เป็น Infographic สรุปรายชั้นที่สวยงามและเข้าใจง่าย โดยต้องตอบกลับเป็น JSON object ที่ถูกต้องตาม schema ที่กำหนดเท่านั้น",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  infographicData: {
                    type: Type.OBJECT,
                    properties: {
                      reportDate: {
                        type: Type.STRING,
                        description: `วันที่ของรายงาน, คือ '${dateString}'`,
                      },
                      executiveSummary: {
                        type: Type.STRING,
                        description:
                          "สรุปภาพรวมทั้งหมดของพื้นที่ส่วนกลาง 1-2 ประโยคที่กระชับที่สุด",
                      },
                      overallProgress: {
                        type: Type.NUMBER,
                        description:
                          "คำนวณค่าเฉลี่ยความคืบหน้าของ 'ทุกงาน' ใน 'ทุกพื้นที่' และ 'ทุกชั้น' รวมกันเป็นตัวเลข 0-100",
                      },
                      floorDetails: {
                        type: Type.ARRAY,
                        description:
                          "อาร์เรย์ของข้อมูลสรุปสำหรับแต่ละชั้น ตั้งแต่ชั้น 2 ถึง 8",
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            floor: {
                              type: Type.NUMBER,
                              description: "หมายเลขชั้น (2, 3, ..., 8)",
                            },
                            floorProgress: {
                              type: Type.NUMBER,
                              description:
                                "คำนวณค่าเฉลี่ยความคืบหน้าของ 'ทุกงาน' ใน 'ทุกพื้นที่' เฉพาะของชั้นนี้ เป็นตัวเลข 0-100",
                            },
                            completedTasks: {
                              type: Type.ARRAY,
                              items: { type: Type.STRING },
                              description:
                                "ลิสต์ของงานที่เสร็จสมบูรณ์ 100% ในชั้นนี้ รูปแบบ 'ชื่องาน - ชื่อพื้นที่' (เช่น 'ราวบันได - บันได ST1')",
                            },
                            inProgressTasks: {
                              type: Type.ARRAY,
                              items: { type: Type.STRING },
                              description:
                                "ลิสต์ของงานที่กำลังดำเนินการ (1-99%) ในชั้นนี้ รูปแบบ 'ชื่องาน - ชื่อพื้นที่'",
                            },
                            notes: {
                              type: Type.STRING,
                              description:
                                "สรุปสั้นๆ ที่น่าสนใจเกี่ยวกับความคืบหน้าของชั้นนี้ (เช่น 'งานส่วนใหญ่ในชั้นนี้เสร็จสิ้นแล้ว เหลือเพียงเก็บรายละเอียดเล็กน้อย')",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          };

          document.getElementById("report-modal-title").textContent =
            "สร้าง Infographic พื้นที่ส่วนกลาง";
          const reportContentArea = document.getElementById(
            "report-content-area",
          );
          reportContentArea.innerHTML = `<div class="xl:col-span-3 flex flex-col min-h-0">
                     <div class="relative flex-grow min-h-0">
                        <div id="ai-loading-overlay" class="absolute inset-0 items-center justify-center hidden rounded-lg">
                            <div class="text-center p-4 bg-white/80 rounded-lg shadow-md">
                                <div class="spinner mx-auto"></div><p class="mt-2 font-semibold text-indigo-700">AI กำลังสร้าง Infographic...</p>
                            </div>
                        </div>
                        <div id="infographic-output" class="w-full h-full p-4 border rounded-lg bg-slate-50 overflow-y-auto bg-white shadow"></div>
                     </div>
                     <div class="flex-shrink-0 flex gap-2 mt-2">
                          <button id="downloadInfographicBtn" class="flex-grow p-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2" title="ดาวน์โหลด Infographic เป็นภาพ">
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
                             <span>ดาวน์โหลดภาพ</span>
                          </button>
                    </div>
                </div>`;

          document
            .getElementById("downloadInfographicBtn")
            .addEventListener("click", () =>
              downloadInfographic(
                "infographic-output",
                "downloadInfographicBtn",
              ),
            );
          openModal("reportModal", triggerElement);
          runAIAnalysis(request, (jsonText) => {
            try {
              const aiData = JSON.parse(jsonText);
              renderCommonAreaInfographic(aiData.infographicData);
            } catch (e) {
              console.error("Failed to parse AI JSON response:", e);
              document.getElementById("infographic-output").innerHTML =
                `<p class="text-red-500">เกิดข้อผิดพลาดในการอ่านข้อมูลจาก AI</p>`;
            }
          });
        }

        function renderCommonAreaInfographic(data) {
          const container = document.getElementById("infographic-output");
          if (!data) {
            container.innerHTML = `<p class="text-center text-gray-500">ไม่พบข้อมูลสำหรับสร้าง Infographic</p>`;
            return;
          }

          const renderTaskList = (tasks, icon, colorClass) => {
            if (!tasks || tasks.length === 0)
              return '<p class="text-sm text-gray-500">ไม่มี</p>';
            return `<ul class="space-y-2">${tasks.map((item) => `<li class="flex items-start gap-2 text-sm"><span class="flex-shrink-0 mt-1 ${colorClass}">${icon}</span><span>${item}</span></li>`).join("")}</ul>`;
          };

          const floorDetailsHTML = data.floorDetails
            .map(
              (floor) => `
                    <div class="bg-slate-50 p-4 rounded-lg border">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="text-lg font-bold text-slate-800">ชั้น ${floor.floor}</h4>
                            <p class="font-bold text-amber-600">${floor.floorProgress.toFixed(0)}%</p>
                        </div>
                        <div class="progress-bar-container w-full h-2 mb-4">
                            <div class="progress-bar h-2 rounded-full bg-amber-500" style="width: ${floor.floorProgress}%"></div>
                        </div>
                        <p class="text-sm text-gray-600 mb-3 italic">"${floor.notes}"</p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h5 class="font-semibold mb-2 text-green-600">งานที่เสร็จแล้ว</h5>
                                ${renderTaskList(floor.completedTasks, "✅", "text-green-500")}
                            </div>
                            <div>
                                <h5 class="font-semibold mb-2 text-blue-600">งานที่กำลังทำ</h5>
                                ${renderTaskList(floor.inProgressTasks, "⏳", "text-blue-500")}
                            </div>
                        </div>
                    </div>
                `,
            )
            .join("");

          container.innerHTML = `
                    <div class="space-y-6 p-4 md:p-6">
                        <div class="text-center">
                            <h2 class="text-2xl font-bold text-gray-800">PYNN NGAMWONGWAN 54</h2>
                            <p class="text-lg text-gray-500">Infographic พื้นที่ส่วนกลาง</p>
                            <p class="font-semibold text-emerald-600">🗓️ ประจำวันที่: ${data.reportDate}</p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <div class="md:col-span-2">
                                <h3 class="font-bold text-lg mb-2">✨ สรุปภาพรวม</h3>
                                <p class="text-gray-700">${data.executiveSummary}</p>
                            </div>
                            <div class="flex flex-col items-center">
                                <div class="infographic-progress-circle w-32 h-32 rounded-full flex items-center justify-center" style="--progress: ${data.overallProgress}%">
                                    <span class="text-3xl font-bold text-gray-800">${data.overallProgress.toFixed(0)}%</span>
                                </div>
                                <p class="mt-2 font-semibold text-gray-600">ความคืบหน้าโดยรวม</p>
                            </div>
                        </div>
                        <div>
                             <h3 class="font-bold text-lg text-slate-800 border-b-2 border-slate-200 pb-1 mb-4">ความคืบหน้ารายชั้น</h3>
                             <div class="space-y-4">${floorDetailsHTML}</div>
                        </div>
                    </div>`;
        }

        function renderInfographic(data) {
          const container = document.getElementById("ai-output-infographic");
          if (!data) {
            container.innerHTML = `<p class="text-center text-gray-500">ไม่พบข้อมูลสำหรับสร้าง Infographic</p>`;
            return;
          }

          const keyMetricsHTML = (data.keyMetrics || [])
            .map(
              (metric) => `
                    <div class="bg-slate-50 p-3 rounded-lg text-center border">
                        <p class="text-sm text-gray-500">${metric.label}</p>
                        <p class="text-2xl font-bold text-gray-800">${metric.value}</p>
                    </div>
                `,
            )
            .join("");

          const iconMap = {
            well: `<svg class="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`,
            concern: `<svg class="w-5 h-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-8a1 1 0 011-1h.008a1 1 0 011 1v3.008a1 1 0 01-1 1H9a1 1 0 01-1-1V5z" clip-rule="evenodd" /></svg>`,
            plan: `<svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M11.983 1.904a.75.75 0 00-1.292-.748L4.319 9.923a.75.75 0 000 .748l6.372 8.767a.75.75 0 001.292-.748L6.47 10.297l5.513-8.393z" /></svg>`,
          };
          const createList = (items, icon) =>
            (items || [])
              .map(
                (item) =>
                  `<li class="flex items-start gap-3"><span class="flex-shrink-0 mt-1">${icon}</span><p class="text-gray-700">${item}</p></li>`,
              )
              .join("");

          container.innerHTML = `
                    <div class="p-2 sm:p-4 bg-white font-sans">
                        <div class="border rounded-lg p-4 sm:p-6 space-y-6">
                            <!-- Header -->
                            <div class="text-center">
                                <h2 class="text-xl sm:text-2xl font-bold text-gray-800">PYNN NGAMWONGWAN 54</h2>
                                <p class="text-gray-500">${data.reportTitle}</p>
                                <p class="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full mt-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" /></svg>
                                    ประจำวันที่: ${data.reportDate}
                                </p>
                            </div>

                            <!-- Summary & Overall Progress -->
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                                <div class="lg:col-span-2 space-y-2">
                                    <h3 class="font-bold text-lg inline-flex items-center gap-2">
                                       <span class="bg-yellow-100 p-1.5 rounded-full">✨</span>
                                       <span>สรุปภาพรวม</span>
                                    </h3>
                                    <p class="text-gray-600">${data.executiveSummary}</p>
                                </div>
                                <div class="flex flex-col items-center justify-center">
                                    <div class="infographic-progress-circle w-36 h-36 rounded-full flex items-center justify-center" style="--progress: ${data.overallProgress}%">
                                        <div>
                                            <span class="text-4xl font-bold text-gray-800">${data.overallProgress.toFixed(1)}%</span>
                                            <p class="text-xs text-gray-500 text-center -mt-1">ความคืบหน้าโดยรวม</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Key Metrics -->
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">${keyMetricsHTML}</div>

                            <!-- Details Grid -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 pt-4">
                                <!-- Progressing Well -->
                                <div class="space-y-3">
                                    <h3 class="font-bold text-lg border-b-2 border-green-200 pb-2 inline-flex items-center gap-2">
                                        <svg class="w-6 h-6 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 011.5 1.5v2.879a1.5 1.5 0 01.44 1.06l.002.004.001.004c.063.26.18.506.33.731l.003.005.003.005a1.5 1.5 0 01-2.483 1.815l-.004-.002-.004-.003a2.984 2.984 0 00-.41-1.332l-.003-.005-.003-.005A1.5 1.5 0 018 9.942V5A1.5 1.5 0 019.5 3.5h.5zM13 5a1.5 1.5 0 011.5 1.5v4.563a1.5 1.5 0 01-1.026 1.416l-.003.001-.003.001c-.328.163-.68.293-1.04.385l-.004.001-.004.001a1.5 1.5 0 01-1.85-1.477l.001-.003.001-.003a2.951 2.951 0 001.09-1.93l.003-.005.003-.005A1.5 1.5 0 0113 9.437V5z" /></svg>
                                        งานที่คืบหน้าได้ดี
                                    </h3>
                                    <ul class="space-y-3">${createList(data.progressingWell, iconMap.well)}</ul>
                                </div>
                                
                                <!-- Areas of Concern -->
                                <div class="space-y-3">
                                    <h3 class="font-bold text-lg border-b-2 border-red-200 pb-2 inline-flex items-center gap-2">
                                         <svg class="w-6 h-6 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1a9 9 0 100 18 9 9 0 000-18zM9 4a1 1 0 112 0v1a1 1 0 11-2 0V4zm3 8a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1z" clip-rule="evenodd" /></svg>
                                        จุดที่ต้องให้ความสำคัญ
                                    </h3>
                                    <ul class="space-y-3">${createList(data.areasOfConcern, iconMap.concern)}</ul>
                                </div>
                            </div>
                             <!-- Plan & Recommendations -->
                            <div class="space-y-3 pt-4 bg-slate-50 p-4 rounded-lg border">
                                <h3 class="font-bold text-lg inline-flex items-center gap-2">
                                    <svg class="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M11.983 1.904a.75.75 0 00-1.292-.748L4.319 9.923a.75.75 0 000 .748l6.372 8.767a.75.75 0 001.292-.748L6.47 10.297l5.513-8.393z" /></svg>
                                    แผนงานและข้อเสนอแนะ
                                </h3>
                                <ul class="space-y-3">${createList(data.recommendations, iconMap.plan)}</ul>
                            </div>
                        </div>
                    </div>
                `;
        }

        function downloadInfographic(elementId, buttonId) {
          const infographicElement = document.getElementById(elementId);
          const downloadBtn = document.getElementById(buttonId);
          if (
            !infographicElement ||
            infographicElement.children.length === 0 ||
            infographicElement.querySelector("p.text-gray-500")
          ) {
            showNotificationModal(
              "ไม่สำเร็จ",
              "ไม่พบข้อมูล Infographic ที่จะดาวน์โหลด",
            );
            return;
          }

          const originalContent = downloadBtn.innerHTML;
          downloadBtn.innerHTML = "กำลังเตรียม...";
          downloadBtn.disabled = true;

          html2canvas(infographicElement.querySelector(":first-child"), {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
          })
            .then((canvas) => {
              const link = document.createElement("a");
              link.download = `infographic-report-${Date.now()}.png`;
              link.href = canvas.toDataURL("image/png");
              link.click();
            })
            .catch((err) => {
              console.error("Infographic capture failed:", err);
              showNotificationModal(
                "เกิดข้อผิดพลาด",
                "ไม่สามารถสร้างไฟล์ภาพได้",
              );
            })
            .finally(() => {
              downloadBtn.innerHTML = originalContent;
              downloadBtn.disabled = false;
            });
        }

        function copyToClipboard(textareaId, buttonId) {
          const textarea = document.getElementById(textareaId);
          const button = document.getElementById(buttonId);
          if (!textarea.value || button.disabled) return;

          const showSuccess = () => {
            const originalContent = button.innerHTML;
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M20 6 9 17l-5-5"></path></svg> <span>คัดลอกแล้ว!</span>`;
            button.disabled = true;
            setTimeout(() => {
              button.innerHTML = originalContent;
              button.disabled = false;
            }, 2000);
          };

          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard
              .writeText(textarea.value)
              .catch(() => showToast("ไม่สามารถคัดลอกได้"));
            showSuccess();
          } else {
            try {
              textarea.select();
              document.execCommand("copy");
              showSuccess();
            } catch (err) {
              showToast("ไม่สามารถคัดลอกได้");
            }
          }
        }

        function clearSelection() {
          selectedCells.forEach((cell) =>
            cell.classList.remove("selection-active"),
          );
          selectedCells.clear();
        }

        function filterTasks(term) {
          term = term.toLowerCase();
          const groups = document.querySelectorAll(
            "#task-category-buttons > div",
          );
          groups.forEach((group) => {
            let hasVisibleBtn = false;
            const btns = group.querySelectorAll("button");
            btns.forEach((btn) => {
              const text = btn.textContent.toLowerCase();
              if (text.includes(term)) {
                btn.style.display = "";
                hasVisibleBtn = true;
              } else {
                btn.style.display = "none";
              }
            });
            group.style.display = hasVisibleBtn ? "" : "none";
          });
        }

        function bindEventListeners() {
          let clearDataConfirmationStep = 0;

          // Main App Nav
          document
            .getElementById("home-btn")
            .addEventListener("click", backToSplash);
          document
            .getElementById("quick-update-home-btn")
            .addEventListener("click", backToSplash);

          document
            .getElementById("closeModalBtn")
            .addEventListener("click", () => closeModal("updateModal"));
          document
            .getElementById("closeModalIconBtn")
            .addEventListener("click", () => closeModal("updateModal"));
          document
            .getElementById("saveProgressBtn")
            .addEventListener("click", saveProgress);

          // Quick Progress Buttons
          document.querySelectorAll(".quick-progress-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
              const val = e.target.getAttribute("data-value");
              document.getElementById("progress-input").value = val;
            });
          });

          document
            .getElementById("clearDataBtn")
            .addEventListener("click", (e) => {
              const CONFIRM_COUNT = 5;
              const triggerElement = e.currentTarget;

              const executeClear = async () => {
                const initialData = generateInitialDataObject();
                try {
                  const { error } = await supabaseClient
                    .from(CONFIG.DB_TABLE_NAME)
                    .update({ data: initialData })
                    .eq("id", CONFIG.DB_ROW_ID);
                  if (error) throw error;

                  projectData = initialData;
                  renderTable();
                  showToast("รีเซ็ตข้อมูลบนเซิร์ฟเวอร์แล้ว");
                } catch (err) {
                  console.error("Error resetting data:", err);
                  showNotificationModal(
                    "เกิดข้อผิดพลาด",
                    "ไม่สามารถรีเซ็ตข้อมูลได้",
                  );
                } finally {
                  closeModal("confirmModal");
                  clearDataConfirmationStep = 0;
                }
              };

              const askForConfirmation = () => {
                clearDataConfirmationStep++;
                if (clearDataConfirmationStep > CONFIRM_COUNT) {
                  executeClear();
                } else {
                  let message = `นี่คือการยืนยันครั้งที่ ${clearDataConfirmationStep} จาก ${CONFIRM_COUNT} คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมด?`;
                  if (clearDataConfirmationStep === CONFIRM_COUNT) {
                    message = `นี่คือการยืนยันครั้งสุดท้าย! การกระทำนี้ไม่สามารถย้อนกลับได้ คุณแน่ใจจริงๆ หรือไม่?`;
                  }
                  showConfirmModal(
                    "ยืนยันการล้างข้อมูล",
                    message,
                    askForConfirmation,
                    triggerElement,
                  );
                }
              };

              clearDataConfirmationStep = 0;
              askForConfirmation();
            });

          document
            .getElementById("confirmCancelBtn")
            .addEventListener("click", () => {
              closeModal("confirmModal");
              if (clearDataConfirmationStep > 0) {
                showToast("การล้างข้อมูลถูกยกเลิก");
                clearDataConfirmationStep = 0;
              }
              confirmCallback = null;
            });
          document
            .getElementById("confirmOkBtn")
            .addEventListener("click", () => {
              if (confirmCallback) confirmCallback();
            });

          document
            .getElementById("exportDataBtn")
            .addEventListener("click", exportData);
          document
            .getElementById("import-file")
            .addEventListener("change", importData);

          // Summary Plan Modal Event Listeners
          document
            .getElementById("closeSummaryPlanModalBtn")
            .addEventListener("click", () => closeModal("summaryPlanModal"));
          document
            .getElementById("cancelSummaryPlanBtn")
            .addEventListener("click", () => closeModal("summaryPlanModal"));
          document
            .getElementById("saveSummaryPlanBtn")
            .addEventListener("click", saveSummaryPlan);
          document
            .getElementById("clearSummaryPlanNoteBtn")
            .addEventListener("click", window.clearSummaryPlanNote);
          document
            .getElementById("clearSummaryPlanDateBtn")
            .addEventListener("click", window.clearSummaryPlanDate);
          document
            .getElementById("clearSummaryPlanHistoryBtn")
            .addEventListener("click", window.clearSummaryPlanHistory);
          document
            .getElementById("summaryPlanDateInput")
            .addEventListener("input", updateSummaryPlanDelayInfo);

          document
            .getElementById("captureDownloadBtn")
            .addEventListener("click", () =>
              captureForLine("download", "captureDownloadBtn"),
            );
          document
            .getElementById("captureShareBtn")
            .addEventListener("click", () =>
              captureForLine("share", "captureShareBtn"),
            );
          document
            .getElementById("captureNewBtn")
            .addEventListener("click", () =>
              captureForLineNew("download", "captureNewBtn"),
            );
          document
            .getElementById("captureUltraBtn")
            .addEventListener("click", () => {
              alert("คำเตือน:\n\nรูปแบบไฟล์ภาพความละเอียดสูง (Ultra HD) ไม่เหมาะสำหรับการส่งผ่านแอปพลิเคชัน LINE เนื่องจากระบบของ LINE จะทำการบีบอัดภาพที่มีขนาดใหญ่เกินไปอย่างหนัก ทำให้ภาพแตกและเบลอ\n\nหากต้องการภาพเพื่อส่งลง LINE Group แนะนำให้ใช้ปุ่ม 'แคปเจอร์' แบบปกติแทน");
              captureForLineNew("download", "captureUltraBtn", true);
            });

          document
            .getElementById("exportPdfBtn")
            .addEventListener("click", exportAsPdfNew);

          document
            .getElementById("toggleExecutiveSummaryBtn")
            .addEventListener("click", () => {
              showExecutiveSummary = !showExecutiveSummary;
              const btn = document.getElementById("toggleExecutiveSummaryBtn");

              if (showExecutiveSummary) {
                btn.classList.add(
                  "bg-indigo-50",
                  "text-indigo-600",
                  "border-indigo-200",
                );
                btn.classList.remove(
                  "bg-white",
                  "text-slate-700",
                  "border-slate-200",
                );
              } else {
                btn.classList.remove(
                  "bg-indigo-50",
                  "text-indigo-600",
                  "border-indigo-200",
                );
                btn.classList.add(
                  "bg-white",
                  "text-slate-700",
                  "border-slate-200",
                );
              }

              // Update visibility of overall-progress-toggle-btn
              const toggleOverallBtn = document.getElementById(
                "overall-progress-toggle-btn",
              );
              if (toggleOverallBtn) {
                const isResidentialOrSummary =
                  currentView === "residential" ||
                  currentView === "summaryReport";
                toggleOverallBtn.classList.toggle(
                  "hidden",
                  !isResidentialOrSummary || !showExecutiveSummary,
                );
              }

              renderExecutiveSummaryDashboard();
            });
          document
            .getElementById("toggleCaptureModeBtn")
            .addEventListener("click", () => {
              document.documentElement.classList.add("is-line-capturing");
              document.body.classList.add("is-line-capturing");
            });
          document
            .getElementById("exitCaptureModeFloatingBtn")
            .addEventListener("click", () => {
              document.documentElement.classList.remove("is-line-capturing");
              document.body.classList.remove("is-line-capturing");
            });
          document.addEventListener("keydown", (e) => {
            if (
              e.key === "Escape" &&
              document.body.classList.contains("is-line-capturing")
            ) {
              document.documentElement.classList.remove("is-line-capturing");
              document.body.classList.remove("is-line-capturing");
            }
          });
          document.addEventListener("mouseleave", () => {
            if (document.body.classList.contains("is-line-capturing")) {
              const btn = document.getElementById("exitCaptureModeFloatingBtn");
              if (btn) btn.style.opacity = "0";
            }
          });
          document.addEventListener("mouseenter", () => {
            if (document.body.classList.contains("is-line-capturing")) {
              const btn = document.getElementById("exitCaptureModeFloatingBtn");
              if (btn) btn.style.opacity = "";
            }
          });
          document
            .getElementById("openReportModalBtn")
            .addEventListener("click", (e) =>
              setupAndOpenReportModal(e.currentTarget),
            );
          document
            .getElementById("openCommonAreaReportModalBtn")
            .addEventListener("click", (e) =>
              setupAndOpenCommonAreaReportModal(e.currentTarget),
            );
          document
            .getElementById("closeReportModalBtn")
            .addEventListener("click", () => closeModal("reportModal"));
          document
            .getElementById("notificationOkBtn")
            .addEventListener("click", () => closeModal("notificationModal"));

          document
            .getElementById("task-search-input")
            .addEventListener("input", (e) => {
              filterTasks(e.target.value);
            });

          // Removed dropdown change listener as it's now handled by buttons

          const viewResidentialBtn = document.getElementById(
            "view-residential-btn",
          );
          const viewQCSummaryBtn = document.getElementById(
            "view-qc-summary-btn",
          );
          const viewCommonBtn = document.getElementById("view-common-btn");
          const viewSummaryReportBtn = document.getElementById(
            "view-summary-report-btn",
          );
          const viewScheduleBtn = document.getElementById("view-schedule-btn");
          const viewQCHandoverBtn = document.getElementById(
            "view-qc-handover-btn",
          );

          viewResidentialBtn.addEventListener("click", () =>
            enterAppView("residential"),
          );
          viewQCSummaryBtn.addEventListener("click", () =>
            enterAppView("qcSummary"),
          );
          viewCommonBtn.addEventListener("click", () => enterAppView("common"));
          viewSummaryReportBtn.addEventListener("click", () =>
            enterAppView("summaryReport"),
          );
          if (viewScheduleBtn)
            viewScheduleBtn.addEventListener("click", () =>
              enterAppView("schedule"),
            );
          if (viewQCHandoverBtn)
            viewQCHandoverBtn.addEventListener("click", () =>
              enterAppView("qcHandover"),
            );

          document
            .getElementById("summary-report-wet-btn")
            .addEventListener("click", () => {
              summaryReportMode = "wetWork";
              enterAppView("summaryReport");
            });
          document
            .getElementById("summary-report-end-btn")
            .addEventListener("click", () => {
              summaryReportMode = "endProduct";
              enterAppView("summaryReport");
            });

          document
            .getElementById("header-style-dark-btn")
            .addEventListener("click", () => {
              reportHeaderStyle = "dark";
              enterAppView(currentView);
            });
          document
            .getElementById("header-style-light-btn")
            .addEventListener("click", () => {
              reportHeaderStyle = "light";
              enterAppView(currentView);
            });

          document
            .getElementById("task-view-summary-btn")
            .addEventListener("click", () => {
              isDetailedViewActive = false;
              enterAppView(currentView);
            });
          document
            .getElementById("task-view-detailed-btn")
            .addEventListener("click", () => {
              isDetailedViewActive = true;
              enterAppView(currentView);
            });

          const mainTable = document.getElementById("main-table");

          let touchStartX = 0;
          let touchStartY = 0;
          let isTouchScrolling = false;
          let lastTouchTime = 0;
          let selectionLock = false;
          let touchTimer = null;
          let touchStartCell = null;

          function handleSelectionStart(e) {
            if (e.type.includes("touch")) {
              lastTouchTime = Date.now();
            } else {
              // Ignore simulated mouse events after touch
              if (Date.now() - lastTouchTime < 500) {
                return;
              }
            }

            let target = e.type.includes("touch")
              ? e.touches[0].target
              : e.target;
            if (target.nodeType === 3) target = target.parentNode; // Handle text nodes
            const cell = target.closest(".table-cell");
            if (!cell) return;

            if (e.type.includes("touch")) {
              touchStartX = e.touches[0].clientX;
              touchStartY = e.touches[0].clientY;
              isTouchScrolling = false;
              selectionLock = false;
              touchStartCell = cell;

              // Smart timer: if held for 250ms, lock into selection mode
              if (touchTimer) clearTimeout(touchTimer);
              touchTimer = setTimeout(() => {
                selectionLock = true;
                if (touchStartCell && !isTouchScrolling) {
                  if (currentView === "qcSummary") {
                    clearSelection();
                  }
                  touchStartCell.classList.add("selection-active");
                  selectedCells.add(touchStartCell);
                  if (window.navigator && window.navigator.vibrate) {
                    try {
                      window.navigator.vibrate(25);
                    } catch (err) {}
                  }
                }
              }, 250);
            } else {
              e.preventDefault();
            }

            isSelecting = true;

            if (!e.type.includes("touch")) {
              if (
                currentView === "qcSummary" ||
                (!e.ctrlKey && !e.type.includes("touch"))
              ) {
                clearSelection();
              }

              cell.classList.toggle("selection-active");
              if (cell.classList.contains("selection-active")) {
                selectedCells.add(cell);
              } else {
                selectedCells.delete(cell);
              }
            }
          }

          function handleSelectionMove(e) {
            if (!isSelecting) return;

            let target;
            if (e.type.includes("touch")) {
              const touch = e.touches[0];
              const deltaX = Math.abs(touch.clientX - touchStartX);
              const deltaY = Math.abs(touch.clientY - touchStartY);

              if (selectionLock) {
                e.preventDefault(); // Lock scroll now that we are in selection mode
              } else {
                // If moved significantly before lock, cancel selection and allow scroll
                if (deltaX > 20 || deltaY > 20) {
                  if (touchTimer) {
                    clearTimeout(touchTimer);
                    touchTimer = null;
                  }
                  isTouchScrolling = true;
                  isSelecting = false;
                  clearSelection();
                  return;
                }
                // If not locked yet and distance is small, don't do selection yet to avoid wiggles
                return;
              }

              target = document.elementFromPoint(touch.clientX, touch.clientY);
            } else {
              target = e.target;
            }

            if (!target) return;
            if (target.nodeType === 3) target = target.parentNode; // Handle text nodes
            const cell = target.closest(".table-cell");
            if (cell && !selectedCells.has(cell)) {
              if (currentView === "qcSummary") {
                // Single selection only in QC summary
                return;
              }
              cell.classList.add("selection-active");
              selectedCells.add(cell);
            }
          }

          function handleSelectionEnd(e) {
            if (touchTimer) {
              clearTimeout(touchTimer);
              touchTimer = null;
            }

            if (e.type === "touchcancel") {
              isSelecting = false;
              isTouchScrolling = false;
              selectionLock = false;
              clearSelection();
              return;
            }

            if (e.type.includes("touch") || e.type === "touchend") {
              if (isTouchScrolling) {
                isSelecting = false;
                isTouchScrolling = false;
                selectionLock = false;
                return;
              }
            }

            if (isSelecting) {
              // If it was a tap (no selection yet and not scrolling)
              if (
                selectedCells.size === 0 &&
                !isTouchScrolling &&
                touchStartCell
              ) {
                if (currentView === "qcSummary") {
                  clearSelection();
                }
                touchStartCell.classList.add("selection-active");
                selectedCells.add(touchStartCell);
              }

              isSelecting = false;
              selectionLock = false;

              if (currentView === "qcSummary" && selectedCells.size > 1) {
                showToast("ไม่สามารถเลือกหลายรายการในมุมมองสรุป QC ได้", 2500);
                clearSelection();
                return;
              }
              if (selectedCells.size > 0) {
                const firstCell = selectedCells.values().next().value;
                if (currentView === "qcSummary") {
                  const qcType = firstCell.dataset.qcType;
                  if (qcType && taskDefinitions[qcType]) {
                    currentCategory = qcType;
                  }
                }
                openUpdateModal(firstCell);
              }
            }
          }

          mainTable.addEventListener("mousedown", handleSelectionStart);
          mainTable.addEventListener("mouseover", handleSelectionMove);
          document.addEventListener("mouseup", handleSelectionEnd);

          mainTable.addEventListener("touchstart", handleSelectionStart, {
            passive: false,
          });
          mainTable.addEventListener("touchmove", handleSelectionMove, {
            passive: false,
          });
          document.addEventListener("touchend", handleSelectionEnd);
          document.addEventListener("touchcancel", handleSelectionEnd);

          // Quick Update Mode Listeners
          document
            .getElementById("quick-update-floor-selector-container")
            .addEventListener("click", (e) => {
              const button = e.target.closest("button");
              if (!button) return;
              const floor = button.dataset.floor;

              document
                .querySelectorAll(
                  "#quick-update-floor-selector-container button",
                )
                .forEach((p) => p.classList.remove("active"));
              button.classList.add("active");

              currentQuickUpdateRoom.floor = parseInt(floor, 10);
              currentQuickUpdateRoom.room = null; // Reset room when floor changes
              populateQuickUpdateRoomPills(floor);
              renderQuickUpdateTaskList();
            });

          document
            .getElementById("quick-update-room-selector-container")
            .addEventListener("click", (e) => {
              const button = e.target.closest("button");
              if (!button) return;
              const room = button.dataset.room;

              document
                .querySelectorAll(
                  "#quick-update-room-selector-container button",
                )
                .forEach((p) => p.classList.remove("active"));
              button.classList.add("active");

              currentQuickUpdateRoom.room = parseInt(room, 10);
              renderQuickUpdateTaskList();
            });
          document
            .getElementById("quick-update-task-list")
            .addEventListener("click", handleQuickUpdate);
        }

        // --- INITIALIZATION ---
        function initializeAI() {
          try {
            ai = new GoogleGenAI({
              apiKey: "AIzaSyCqwffIizNawR4mfHmYx_vVXp_-lRFw6PU",
            });
            console.log("Google AI client initialized.");
          } catch (error) {
            console.warn(
              "Could not initialize Google AI SDK. AI features will be disabled.",
              error.message,
            );
            // Don't block the main app from loading. The AI functions will handle the 'ai' instance being null.
          }
        }

        function init() {
          setupCategoryButtons();
          bindEventListeners();
          initializeAI(); // Initialize AI, but don't block app load if it fails.
          if (initializeSupabase()) {
            setupRealtimeListenerAndInitApp();
          }
        }

        init();
      });
    