const input = document.getElementById("studentId");
const button = document.getElementById("loginBtn");

button.addEventListener("click", function () {

    const studentId = input.value.trim();

    // 관리자 코드
    if (studentId === "6712") {
        window.location.href = "pages/admin.html";
        return;
    }

    // 4자리인지 확인
    if (studentId.length !== 4) {
        alert("학번은 4자리로 입력해주세요!");
        return;
    }

    // 숫자인지 확인
    if (isNaN(studentId)) {
        alert("숫자만 입력해주세요!");
        return;
    }

    // 2학년 6반인지 확인
    if (!studentId.startsWith("26")) {
        alert("2학년 6반 학번을 입력해주세요!");
        return;
    }

    // 번호 확인 (01~19)
    const number = parseInt(studentId.substring(2));

    if (number < 1 || number > 19) {
        alert("우리 반은 1번부터 19번까지입니다.");
        return;
    }

    // ⭐ 관리자 확인 여부 확인
    const confirmed =
        localStorage.getItem("confirmed_" + studentId) === "true";

    if (!confirmed) {
        alert("아직 관리자의 확인이 완료되지 않았습니다.");
        return;
    }

    // 학번 저장
    localStorage.setItem("studentId", studentId);

    // 번호 선택 화면으로 이동
    window.location.href = "pages/student.html";
});