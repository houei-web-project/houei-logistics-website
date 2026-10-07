const $w = $(window),
      $b = $('body');

gsap.registerPlugin(ScrollTrigger);

/*****************************************************
 *
 * スマホでのタップ挙動調整
 *
 *****************************************************/

// スマホで触れている間だけhoverする処理
// $(function () {
//     $('a, label, button').on('touchstart', function () {
//         $(this).addClass('is-hover');
//     }).on('touchend', function () {
//         $(this).removeClass('is-hover');
//     });
// });

// // Fast Click
// document.addEventListener('DOMContentLoaded', function () {
//     FastClick.attach(document.body);
// }, false);



/*****************************************************
 *
 * するするスクロール
 *
 *****************************************************/

//するするスクロール
(function setAnchorClickEvent() {
    //通常のクリック時
    $('a[href^="#"]').click(function () {
        //ページ内リンク先を取得
        var href = $(this).attr("href"); //リンク先が#か空だったらhtmlに

        var hash = href == "#" || href == "" ? 'html' : href; //スクロール実行

        if(hash!=='html') {
            scrollToAnker(hash); //リンク無効化
            return false;
        }
    });
}());

function scrollToAnker(hash) {
    var headerHeight = 0; //ヘッダーは122px. 

    var target = $(hash);

    if (target[0]) {
        var position = target.offset().top - headerHeight;
        $('body,html').stop().animate({
        scrollTop: position
        }, 500);
    } else {
        console.log("hash" + hash + "が見つかりません");
    }
} // a要素のクリック時にセット



/*****************************************************
 *
 * ページ読み込み時のtransitionによるアニメーションをキャンセル
 *
 *****************************************************/

/* 読み込み時のtransitionによるアニメーションをキャンセル */
setTimeout(transitionCancel,100);
function transitionCancel (){
    document.body.classList.remove("c-preload")
}



/*****************************************************
 *
 * ページ遷移アニメーション
 *
 *****************************************************/

window.addEventListener('load', showPage());
window.addEventListener('pageshow', showPage());
function showPage() {
    setTimeout( function() {
        // $(".c-loader").removeClass("is-hide");
        $(".js-kv").addClass("is-animated")
        $(".c-headline-page").addClass("is-animated")
    }, 200)
}



/*****************************************************
 *
 * メニューとナビゲーション
 *
 *****************************************************/

const $menu = $('.c-drawer'),
$btn_menu = $('.js-hamburger'),
$drawer_menu = $('.c-sp-menu__inner .c-list-menu li a');

// メニューの開閉
$btn_menu.on('click', function () { toggleSpMenu() });
$drawer_menu.on('click', function () { toggleSpMenu() });

let current_scrollY;

function toggleSpMenu() {
    $btn_menu.toggleClass('is-active');
    $menu.toggleClass('is-active');
    // $b.toggleClass('is-fixed');
}



/*****************************************************
 *
 * aboutページパララックス
 *
 *****************************************************/

const parallax = document.querySelector('.js-parallax-company');

if (parallax) {

    gsap.to('.js-parallax-company img', {
        yPercent: -35,
        ease: 'linear',
        scrollTrigger: {
            trigger: parallax,
            scrub: true,
            start: 'top bottom',
            end: 'bottom top',
            // markers: true
        }
    })
}




/*****************************************************
 *
 * 下スクロールでheader非表示、上スクロールでheader表示
 *
 *****************************************************/

const header = document.querySelector('.c-header');

let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    let scrollTop = window.scrollY;

    if (scrollTop > lastScrollTop) {
        header.classList.add('is-hide');
    } else {
        header.classList.remove('is-hide');
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
})



/*****************************************************
 *
 * スクロールアニメーション
 *
 *****************************************************/

const fadein = document.querySelectorAll('.a-fadein, .a-trigger, .a-reveal-image, .a-reveal-text');
fadein.forEach(item => {
    ScrollTrigger.create({
        start: 'top 85%',
        onEnter: () => item.classList.add('is-animated'),
        trigger: item,
        // markers: true,
    });
})

const sidebar = document.querySelector('.c-sidebar');
ScrollTrigger.create({
    trigger: '.c-footer',
    start: 'top bottom',
    onEnter: () => sidebar.classList.add('is-hide'),
    onLeaveBack: () => sidebar.classList.remove('is-hide'),
    scrub: true,
    // markers: true,
})



/*****************************************************
 *
 * Google Maps APIを使用してピンを二つ立てる
 *
 *****************************************************/

async function initMap() {

    // 地図の中心を設定
    const center = { lat: 34.83580209600533, lng: 136.3143739114815 };

    // マーカーを立てたい場所を設定
    const positions = [
        {
            position: { lat: 34.847838535635915, lng: 136.44042348173434 },
            title: '豊栄物流本社'
        },
        {
            position: { lat: 34.804236293297706, lng: 136.17396091565777 },
            title: '上野配送センター'
        }
    ]

    //initMap()関数が呼び出されるとMap,AdvancedMarkerViewライブラリが読み込まれる
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerView } = await google.maps.importLibrary("marker");
  
    //map初期化
    const map = new Map(document.getElementById('map'), {
        zoom: 10,
        center: center,
        mapId: 'houei_map'
    });

    //infoWindow初期化
    const infoWindow = new google.maps.InfoWindow();

    positions.forEach(({position, title}, i) => {
        //マーカーに番号振る
        const pinView = new google.maps.marker.PinView({
            glyph: `${i + 1}`,
        });

        //マーカー表示させる
        const marker = new google.maps.marker.AdvancedMarkerView({
            position,
            map,
            title: `${i + 1}. ${title}`,
            content: pinView.element,
        });
      
        //マーカーをクリックしたときに、infoWindowを表示させる
        marker.addListener("click", ({ domEvent, latLng }) => {
            const { target } = domEvent;
        
            infoWindow.close();
            infoWindow.setContent(marker.title);
            infoWindow.open(marker.map, marker);
        });
    })
}

if (document.getElementById("map") && window.google?.maps?.importLibrary) { initMap().catch(console.error); }
