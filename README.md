# 하늘정원 드론 비행학교

마이크로비트 기울기 센서를 이용하는 교육용 웹 게임입니다.

## 실행

GitHub Pages 주소를 PC Chrome 또는 Edge의 독립된 탭에서 여세요. `index.html`과 같은 폴더의 JS·CSS·이미지가 함께 필요합니다.

## 장치 연결

1. 게임 안의 장치 코드/연결 가이드를 엽니다.
2. MakeCode의 JavaScript 화면에 코드를 붙여넣고 .hex를 다운로드해 MICROBIT 드라이브에 넣습니다. `.ts`는 MakeCode 소스이며 장치에 직접 넣는 .hex가 아닙니다.
3. MakeCode의 시리얼 창 및 포트를 사용하는 프로그램을 닫습니다.
4. 게임에서 USB 연결을 누르고 마이크로비트 포트를 선택합니다.
5. 장치와 웹앱은 모두 115200bps로 통신합니다.

## 조작

기울기로 드론을 조종해 중앙 목표 원 안에 유지합니다. 1인 USB 직접 연결 또는 2인 무선 수신기 연결을 지원합니다. 자세한 장치 코드는 게임의 연결 가이드에 있습니다.

## GitHub Pages 게시

저장소 Settings → Pages → Deploy from a branch → main → /(root) → Save.

## 파일

- index.html: 화면
- style.css: 디자인
- app.js: 게임 및 USB 입력
- 이미지 파일: 게임 배경

## 참고

실제 USB 동작은 사용자 PC와 장치에서 확인해야 합니다. 모바일·앱 내부 브라우저에서는 USB 시리얼 연결이 제한될 수 있습니다. 브라우저별 저장 기록은 GitHub에 올라가지 않습니다.
