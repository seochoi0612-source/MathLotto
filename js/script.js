const input = document.getElementById("studentId");
const button = document.getElementById("loginBtn");


// ========================================
// ☁️ Supabase 준비
// ========================================

async function getDatabase() {

    // 이미 연결되어 있으면 그대로 사용
    if (window.supabaseClient) {
        return window.supabaseClient;
    }


    // Supabase 라이브러리가 이미 있으면 바로 연결
    if (window.supabase) {

        const SUPABASE_URL =
            "https://abprmzsxrgtcabxkmzgc.supabase.co";

        const SUPABASE_KEY =
            "sb_publishable_DnVN7TtI9sfIpIj-jZzbHQ_Zeygm1iU";

        window.supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

        return window.supabaseClient;
    }


    // Supabase 라이브러리가 아직 없으면 불러오기
    await new Promise((resolve, reject) => {

        const script =
            document.createElement("script");

        script.src =
            "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

        script.onload =
            resolve;

        script.onerror =
            reject;

        document.head.appendChild(script);
    });


    const SUPABASE_URL =
        "https://abprmzsxrgtcabxkmzgc.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_DnVN7TtI9sfIpIj-jZzbHQ_Zeygm1iU";


    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    return window.supabaseClient;
}


// ========================================
// 🔐 인증 버튼
// ========================================

button.addEventListener(
    "click",
    async function () {

        const studentId =
            input.value.trim();


        // ====================================
        // 👑 관리자
        // ====================================

        if (studentId === "6712") {

            window.location.href =
                "pages/admin.html";

            return;
        }


        // ====================================
        // 🔢 학번 형식 확인
        // ====================================

        if (studentId.length !== 4) {

            alert(
                "학번은 4자리로 입력해주세요!"
            );

            return;
        }


        if (isNaN(studentId)) {

            alert(
                "숫자만 입력해주세요!"
            );

            return;
        }


        if (!studentId.startsWith("26")) {

            alert(
                "2학년 6반 학번을 입력해주세요!"
            );

            return;
        }


        const number =
            parseInt(
                studentId.substring(2)
            );


        if (
            number < 1 ||
            number > 19
        ) {

            alert(
                "우리 반은 1번부터 19번까지입니다."
            );

            return;
        }


        // ====================================
        // ☁️ Supabase 연결
        // ====================================

        let db;

        try {

            db =
                await getDatabase();

        } catch (error) {

            console.error(
                "Supabase 연결 오류:",
                error
            );

            alert(
                "서버에 연결하지 못했습니다."
            );

            return;
        }


        // ====================================
        // 👩‍🎓 학생 정보 확인
        // ====================================

        const {
            data,
            error
        } =
            await db
                .from("students")
                .select(
                    "student_id, confirmed"
                )
                .eq(
                    "student_id",
                    studentId
                )
                .maybeSingle();


        if (error) {

            console.error(
                "학생 정보 조회 오류:",
                error
            );

            alert(
                "학생 정보를 확인할 수 없습니다."
            );

            return;
        }


        // ====================================
        // 학생 없음
        // ====================================

        if (!data) {

            alert(
                `${studentId} 학생 정보를 찾을 수 없습니다.`
            );

            return;
        }


        // ====================================
        // 관리자 확인 여부
        // ====================================

        if (
            data.confirmed !== true
        ) {

            alert(
                "아직 관리자의 확인이 완료되지 않았습니다."
            );

            return;
        }


        // ====================================
        // 💾 학번 저장
        // ====================================

        localStorage.setItem(
            "studentId",
            studentId
        );


        // ====================================
        // 🎟️ 학생 페이지
        // ====================================

        window.location.href =
            "pages/student.html";
    }
);
