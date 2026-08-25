$(document).ready(function () {
  // con0은 noSwiper (단일 이미지), Swiper 초기화 불필요
});

// enabled 상태 확인 (preview-handler 데이터 업데이트 시)
// preview-handler가 없으면 localhost이므로 체크 안 함
function checkNearbyAttractionsEnabled() {
  if (!window.previewHandler) return;

  if (window.previewHandler.currentData) {
    const nearbyEnabled = window.previewHandler.currentData?.homepage?.customFields?.pages?.nearbyAttractions?.sections?.[0]?.enabled;
    if (nearbyEnabled === false) {
      window.location.href = '404.html';
      return;
    }
  }
}
window._checkPageEnabled = checkNearbyAttractionsEnabled;
