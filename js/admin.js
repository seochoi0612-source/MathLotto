const studentList = document.getElementById("studentList");

const db = supabaseClient;


// ========================================
// 📅 이번 주 시작 날짜
// ========================================

function getWeekKey() {

    const today = new Date();

    const day = today.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);

    monday.setDate(today.getDate() + diff);

    const year = monday.getFullYear();

    const month =
        String(monday.getMonth() + 1).padStart(2, "0");

    const date =
        String(monday.getDate()).padStart(2, "0");

    return `${year}-${month}-${date}`;
}


// ========================================
// 🔢 기본 번호
// ========================================

const DEFAULT_NUMBERS =
    Array.from(
        { length: 17 },
        (_, i) => i + 1
    );


// ========================================
// 👩‍🎓 학생 목록
// ========================================

for (let i = 1; i <= 19; i++) {

    const studentId =
        "26" + String(i).padStart(2, "0");


    const student =
        document.createElement("div");

    student.className = "student";


    // 학번
    const idText =
        document.createElement("span");

    idText.className = "student-id";

    idText.innerText = studentId;


    // 상태
    const status =
        document.createElement("span");

    status.className = "status";


    // 버튼
    const button =
        document.createElement("button");

    button.className = "confirm-btn";


    // ========================================
    // 학생 상태 업데이트
    // ========================================

    async function updateStatus() {

        // 학생 확인 상태
        let confirmed = false;

        const { data: studentData, error: studentError } =
            await db
                .from("students")
                .select("confirmed")
                .eq("student_id", studentId)
                .maybeSingle();


        if (!studentError && studentData) {

            confirmed =
                studentData.confirmed === true;

        } else if (studentError) {

            console.error(
                `${studentId} 학생 상태 오류:`,
                studentError
            );
        }


        // 최근 제출 로또
        const { data: latestTicket, error: ticketError } =
            await db
                .from("tickets")
                .select("id, numbers, submitted_at, confirmed")
                .eq("student_id", studentId)
                .order("id", { ascending: false })
                .limit(1)
                .maybeSingle();


        if (ticketError) {

            console.error(
                `${studentId} 로또 불러오기 오류:`,
                ticketError
            );
        }


        // 기존 티켓 표시 제거
        const oldTickets =
            student.querySelector(".tickets");

        if (oldTickets) {
            oldTickets.remove();
        }


        // ========================================
        // ✅ 학생 인증 상태
        // ========================================

        if (confirmed) {

            status.innerText =
                "✅ 확인됨";

            status.className =
                "status confirmed";

        } else {

            status.innerText =
                "미확인";

            status.className =
                "status not-confirmed";
        }


        // ========================================
        // 🎟️ 최근 로또 제출 상태
        // ========================================

        if (latestTicket) {

            const ticketsBox =
                document.createElement("div");

            ticketsBox.className =
                "tickets";


            const title =
                document.createElement("div");

            title.className =
                "tickets-title";

            title.innerText =
                "🔴 최근 로또 제출";

            ticketsBox.appendChild(title);


            const ticketText =
                document.createElement("div");

            ticketText.className =
                "ticket";

            ticketText.innerText =
                latestTicket.numbers.join(", ");

            ticketsBox.appendChild(ticketText);


            // 로또 확인 여부
            const ticketStatus =
                document.createElement("div");

            ticketStatus.className =
                "ticket-status";


            if (latestTicket.confirmed === true) {

                ticketStatus.innerText =
                    "✅ 로또 확인 완료";

            } else {

                ticketStatus.innerText =
                    "⏳ 로또 확인 대기";
            }


            ticketsBox.appendChild(ticketStatus);


            student.appendChild(
                ticketsBox
            );
        } else {

            const noTicket =
                document.createElement("div");

            noTicket.className =
                "tickets no-ticket";

            noTicket.innerText =
                "⚪ 로또 미제출";

            student.appendChild(
                noTicket
            );
        }


        // ========================================
        // 버튼 상태
        // ========================================

        if (!latestTicket) {

            if (confirmed) {

                button.innerText =
                    "확인";

            } else {

                button.innerText =
                    "확인";
            }

            button.classList.remove("cancel");

        } else if (latestTicket.confirmed === true) {

            button.innerText =
                "확인 완료";

            button.classList.remove("cancel");

        } else {

            button.innerText =
                "로또 확인";

            button.classList.remove("cancel");
        }
    }


    // ========================================
    // ✅ 확인 버튼
    // ========================================

    button.addEventListener(
        "click",
        async function () {

            // ====================================
            // 학생 확인 상태 가져오기
            // ====================================

            const { data: studentData, error: studentError } =
                await db
                    .from("students")
                    .select("confirmed")
                    .eq("student_id", studentId)
                    .maybeSingle();


            if (studentError) {

                console.error(
                    "학생 상태 확인 오류:",
                    studentError
                );

                alert(
                    "학생 정보를 불러오지 못했습니다."
                );

                return;
            }


            const confirmed =
                studentData &&
                studentData.confirmed === true;


            // ====================================
            // 최근 로또 가져오기
            // ====================================

            const { data: latestTicket, error: ticketError } =
                await db
                    .from("tickets")
                    .select("id, confirmed")
                    .eq("student_id", studentId)
                    .order("id", { ascending: false })
                    .limit(1)
                    .maybeSingle();


            if (ticketError) {

                console.error(
                    "최근 로또 확인 오류:",
                    ticketError
                );

                alert(
                    "학생의 로또 정보를 불러오지 못했습니다."
                );

                return;
            }


            // ====================================
            // ① 학생 미확인 → 학생 확인
            // ====================================

            if (!confirmed) {

                const { error: updateError } =
                    await db
                        .from("students")
                        .update({
                            confirmed: true
                        })
                        .eq("student_id", studentId);


                if (updateError) {

                    console.error(
                        "학생 인증 저장 오류:",
                        updateError
                    );

                    alert(
                        "학생 인증 저장에 실패했습니다."
                    );

                    return;
                }


                // 혹시 이미 제출한 로또가 있다면
                // 가장 최근 로또도 확인 처리
                if (latestTicket) {

                    const { error: ticketConfirmError } =
                        await db
                            .from("tickets")
                            .update({
                                confirmed: true
                            })
                            .eq("id", latestTicket.id);


                    if (ticketConfirmError) {

                        console.error(
                            "로또 확인 저장 오류:",
                            ticketConfirmError
                        );
                    }
                }


                alert(
                    `${studentId} 학생이 확인되었습니다.\n\n` +
                    "이제 로또를 제출할 수 있습니다."
                );
            }


            // ====================================
            // ② 학생은 확인됨 + 로또 미제출
            // ====================================

            else if (!latestTicket) {

                alert(
                    `${studentId} 학생은 이미 확인되었습니다.\n\n` +
                    "아직 제출한 로또가 없습니다."
                );
            }


            // ====================================
            // ③ 로또 미확인 → 로또 확인
            // ====================================

            else if (latestTicket.confirmed !== true) {

                const { error: confirmError } =
                    await db
                        .from("tickets")
                        .update({
                            confirmed: true
                        })
                        .eq("id", latestTicket.id);


                if (confirmError) {

                    console.error(
                        "로또 확인 오류:",
                        confirmError
                    );

                    alert(
                        "로또 확인에 실패했습니다."
                    );

                    return;
                }


                alert(
                    `${studentId} 학생의 로또가 확인되었습니다.\n\n` +
                    "이제 다음 로또를 제출할 수 있습니다."
                );
            }


            // ====================================
            // ④ 이미 로또 확인됨
            // ====================================

            else {

                alert(
                    `${studentId} 학생의 최근 로또는 이미 확인되었습니다.`
                );
            }


            await updateStatus();
        }
    );


    student.appendChild(idText);
    student.appendChild(status);
    student.appendChild(button);

    studentList.appendChild(student);

    updateStatus();
}



// ========================================
// 🔢 번호 관리 - Supabase
// ========================================

const numberInput =
    document.getElementById("numberInput");

const saveNumbersBtn =
    document.getElementById("saveNumbersBtn");

const numberStatus =
    document.getElementById("numberStatus");


// ========================================
// ☁️ 번호 가져오기
// ========================================

async function getLottoNumbers() {

    const { data, error } =
        await db
            .from("settings")
            .select("id, numbers")
            .order("id", { ascending: true })
            .limit(1)
            .maybeSingle();


    if (error) {

        console.error(
            "번호 불러오기 오류:",
            error
        );

        return DEFAULT_NUMBERS;
    }


    if (
        data &&
        Array.isArray(data.numbers) &&
        data.numbers.length > 0
    ) {

        return data.numbers;
    }


    return DEFAULT_NUMBERS;
}



// ========================================
// 현재 번호 표시
// ========================================

async function loadNumberSettings() {

    const numbers =
        await getLottoNumbers();


    numberInput.value =
        numbers.join(",");


    numberStatus.innerText =
        `현재 번호: ${numbers.join(", ")}`;
}



// ========================================
// 번호 저장
// ========================================

saveNumbersBtn.addEventListener(
    "click",
    async function () {

        const input =
            numberInput.value.trim();


        if (!input) {

            alert(
                "번호를 입력해주세요."
            );

            return;
        }


        const numbers =
            input
                .split(",")
                .map(number => number.trim())
                .filter(number => number !== "")
                .map(number => Number(number));


        // 숫자 확인
        if (
            numbers.some(
                number =>
                    !Number.isInteger(number)
            )
        ) {

            alert(
                "번호는 숫자로 입력해주세요."
            );

            return;
        }


        // 중복 확인
        const uniqueNumbers =
            [...new Set(numbers)];


        if (
            uniqueNumbers.length !== numbers.length
        ) {

            alert(
                "같은 번호를 중복해서 입력할 수 없습니다."
            );

            return;
        }


        // 최소 6개
        if (numbers.length < 6) {

            alert(
                "번호는 최소 6개 이상 입력해주세요."
            );

            return;
        }


        // settings 행 가져오기
        const { data: settingData, error: settingError } =
            await db
                .from("settings")
                .select("id")
                .order("id", { ascending: true })
                .limit(1)
                .maybeSingle();


        if (settingError || !settingData) {

            console.error(
                "번호 설정 찾기 오류:",
                settingError
            );

            alert(
                "번호 설정을 찾을 수 없습니다."
            );

            return;
        }


        // 저장
        const { error: updateError } =
            await db
                .from("settings")
                .update({
                    numbers: numbers
                })
                .eq("id", settingData.id);


        if (updateError) {

            console.error(
                "번호 저장 오류:",
                updateError
            );

            alert(
                "번호 저장에 실패했습니다."
            );

            return;
        }


        alert(
            "번호가 저장되었습니다!"
        );


        await loadNumberSettings();
    }
);


loadNumberSettings();



// ========================================
// 🎲 추첨
// ========================================

const drawBtn =
    document.getElementById("drawBtn");

const drawInfo =
    document.getElementById("drawInfo");

const drawResult =
    document.getElementById("drawResult");



// ========================================
// 🎉 추첨 결과 표시
// ========================================

function showDrawResult(drawData) {

    if (!drawInfo || !drawResult) {
        return;
    }


    drawInfo.innerText =
        `🎉 ${drawData.draw_date} 추첨 결과`;


    drawResult.innerHTML = "";


    drawData.numbers.forEach(number => {

        const ball =
            document.createElement("span");

        ball.className =
            "draw-number";

        ball.innerText =
            number;

        drawResult.appendChild(ball);
    });
}



// ========================================
// 📂 기존 추첨 결과 불러오기
// ========================================

async function loadDrawResult() {

    const { data, error } =
        await db
            .from("draw_results")
            .select("*")
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();


    if (error) {

        console.error(
            "추첨 결과 불러오기 오류:",
            error
        );

        return;
    }


    if (!data) {
        return;
    }


    showDrawResult(data);
}



// ========================================
// 🎲 추첨하기
// ========================================

drawBtn.addEventListener(
    "click",
    async function () {

        const confirmed =
            confirm(
                "정말 추첨하시겠습니까?\n\n" +
                "추첨을 진행하면 새로운 당첨 번호가 결정됩니다."
            );


        if (!confirmed) {
            return;
        }


        // 설정 번호 가져오기
        const availableNumbers =
            await getLottoNumbers();


        if (availableNumbers.length < 6) {

            alert(
                "추첨하려면 최소 6개의 번호가 필요합니다."
            );

            return;
        }


        // 랜덤 6개
        const numbers = [];


        while (numbers.length < 6) {

            const randomIndex =
                Math.floor(
                    Math.random() *
                    availableNumbers.length
                );


            const number =
                availableNumbers[randomIndex];


            if (!numbers.includes(number)) {

                numbers.push(number);
            }
        }


        numbers.sort(
            (a, b) => a - b
        );


        // 날짜
        const today =
            new Date();


        const year =
            today.getFullYear();

        const month =
            today.getMonth() + 1;

        const date =
            today.getDate();


        const dateText =
            `${year}년 ${month}월 ${date}일`;


        // ====================================
        // ☁️ Supabase에 추첨 결과 저장
        // ====================================

        const { data, error } =
            await db
                .from("draw_results")
                .insert({
                    numbers: numbers,
                    draw_date: dateText
                })
                .select()
                .single();


        if (error) {

            console.error(
                "추첨 결과 저장 오류:",
                error
            );

            alert(
                "추첨 결과 저장에 실패했습니다."
            );

            return;
        }


        // 화면 표시
        showDrawResult(data);


        alert(
            "🎉 추첨이 완료되었습니다!\n\n" +
            `당첨 번호: ${numbers.join(", ")}`
        );
    }
);



// ========================================
// 📂 페이지를 열었을 때 결과 불러오기
// ========================================

loadDrawResult();



// ========================================
// ⚙️ 전체 데이터 초기화
// ========================================

const resetAllBtn =
    document.getElementById("resetAllBtn");


resetAllBtn.addEventListener(
    "click",
    async function () {

        const confirmed =
            confirm(
                "⚠️ 정말 전체 데이터를 초기화하시겠습니까?\n\n" +
                "학생 확인 상태, 제출 번호,\n" +
                "추첨 결과, 번호 설정이 모두 초기화됩니다."
            );


        if (!confirmed) {
            return;
        }


        // ====================================
        // 학생 확인 초기화
        // ====================================

        const { error: studentResetError } =
            await db
                .from("students")
                .update({
                    confirmed: false
                })
                .neq("student_id", "");


        if (studentResetError) {

            console.error(
                "학생 인증 초기화 오류:",
                studentResetError
            );

            alert(
                "학생 인증 상태 초기화에 실패했습니다."
            );

            return;
        }


        // ====================================
        // tickets 전체 삭제
        // ====================================

        const { error: ticketResetError } =
            await db
                .from("tickets")
                .delete()
                .neq("id", 0);


        if (ticketResetError) {

            console.error(
                "로또 데이터 초기화 오류:",
                ticketResetError
            );

            alert(
                "로또 데이터 초기화에 실패했습니다."
            );

            return;
        }


        // ====================================
        // settings 초기화
        // ====================================

        const { data: settingData } =
            await db
                .from("settings")
                .select("id")
                .order("id", { ascending: true })
                .limit(1)
                .maybeSingle();


        if (settingData) {

            const { error: settingsResetError } =
                await db
                    .from("settings")
                    .update({
                        numbers: DEFAULT_NUMBERS
                    })
                    .eq("id", settingData.id);


            if (settingsResetError) {

                console.error(
                    "번호 설정 초기화 오류:",
                    settingsResetError
                );

                alert(
                    "번호 설정 초기화에 실패했습니다."
                );

                return;
            }
        }


        // ====================================
        // draw_results 전체 삭제
        // ====================================

        const { error: drawResetError } =
            await db
                .from("draw_results")
                .delete()
                .neq("id", 0);


        if (drawResetError) {

            console.error(
                "추첨 결과 초기화 오류:",
                drawResetError
            );

            alert(
                "추첨 결과 초기화에 실패했습니다."
            );

            return;
        }


        // ====================================
        // 기존 localStorage 정리
        // ====================================

        localStorage.removeItem("lottoNumbers");
        localStorage.removeItem("drawResult");


        for (let i = 1; i <= 19; i++) {

            const studentId =
                "26" +
                String(i).padStart(2, "0");


            localStorage.removeItem(
                "confirmed_" + studentId
            );


            localStorage.removeItem(
                "submitted_" + studentId
            );


            localStorage.removeItem(
                "studentId"
            );
        }


        alert(
            "✅ 전체 데이터가 초기화되었습니다."
        );


        location.reload();
    }
);



// ========================================
// 🧪 Supabase 연결 확인
// ========================================

async function testSupabase() {

    const { data, error } =
        await db
            .from("students")
            .select("*");


    if (error) {

        console.error(
            "Supabase 연결 오류:",
            error
        );

        return;
    }


    console.log(
        "Supabase 학생 데이터:",
        data
    );
}


testSupabase();
