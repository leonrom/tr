	var aliasConfig = {
appName : ["", "", ""],
totalPageCount : [],
largePageWidth : [],
largePageHeight : [],
normalPath : [],
largePath : [],
thumbPath : [],

ToolBarsSettings:[],
TitleBar:[],
appLogoIcon:["appLogoIcon"],
appLogoLinkURL:["appLogoLinkURL"],
bookTitle : [],
bookDescription : [],
ButtonsBar : [],
ShareButton : [],
ShareButtonVisible : ["socialShareButtonVisible"],
ThumbnailsButton : [],
ThumbnailsButtonVisible : ["enableThumbnail"],
ZoomButton : [],
ZoomButtonVisible : ["enableZoomIn"],
FlashDisplaySettings : [],
MainBgConfig : [],
bgBeginColor : ["bgBeginColor"],
bgEndColor : ["bgEndColor"],
bgMRotation : ["bgMRotation"],
backGroundImgURL : ["mainbgImgUrl","innerMainbgImgUrl"],
pageBackgroundColor : ["pageBackgroundColor"],
flipshortcutbutton : [],
BookMargins : [],
topMargin : [],
bottomMargin : [],
leftMargin : [],
rightMargin : [],
HTMLControlSettings : [],
linkconfig : [],
LinkDownColor : ["linkOverColor"],
LinkAlpha : ["linkOverColorAlpha"],
OpenWindow : ["linkOpenedWindow"],
searchColor : [],
searchAlpha : [],
SearchButtonVisible : ["searchButtonVisible"],

productName : [],
homePage : [],
enableAutoPlay : ["autoPlayAutoStart"],
autoPlayDuration : ["autoPlayDuration"],
autoPlayLoopCount : ["autoPlayLoopCount"],
BookMarkButtonVisible : [],
googleAnalyticsID : ["googleAnalyticsID"],
OriginPageIndex : [],	
HardPageEnable : ["isHardCover"],	
UIBaseURL : [],	
RightToLeft: ["isRightToLeft"],	

LeftShadowWidth : ["leftPageShadowWidth"],	
LeftShadowAlpha : ["pageShadowAlpha"],
RightShadowWidth : ["rightPageShadowWidth"],
RightShadowAlpha : ["pageShadowAlpha"],
ShortcutButtonHeight : [],	
ShortcutButtonWidth : [],
AutoPlayButtonVisible : ["enableAutoPlay"],	
DownloadButtonVisible : ["enableDownload"],	
DownloadURL : ["downloadURL"],
HomeButtonVisible :["homeButtonVisible"],
HomeURL:['btnHomeURL'],
BackgroundSoundURL:['bacgroundSoundURL'],
//TableOfContentButtonVisible:["BookMarkButtonVisible"],
PrintButtonVisible:["enablePrint"],
toolbarColor:["mainColor","barColor"],
loadingBackground:["mainColor","barColor"],
BackgroundSoundButtonVisible:["enableFlipSound"],
FlipSound:["enableFlipSound"],
MiniStyle:["userSmallMode"],
retainBookCenter:["moveFlipBookToCenter"],
totalPagesCaption:["totalPageNumberCaptionStr"],
pageNumberCaption:["pageIndexCaptionStrs"]
};
var aliasLanguage={
frmPrintbtn:["frmPrintCaption"],
frmPrintall : ["frmPrintPrintAll"],
frmPrintcurrent : ["frmPrintPrintCurrentPage"],
frmPrintRange : ["frmPrintPrintRange"],
frmPrintexample : ["frmPrintExampleCaption"],
btnLanguage:["btnSwicthLanguage"],
btnTableOfContent:["btnBookMark"]
}
;
	var bookConfig = {
	appName:'flippdf',
	totalPageCount : 0,
	largePageWidth : 1080,
	largePageHeight : 1440,
	normalPath : "files/page/",
	largePath : "files/large/",
	thumbPath : "files/thumb/",
	
	ToolBarsSettings:"",
	TitleBar:"",
	appLogoLinkURL:"",
	bookTitle:"FLIPBUILDER",
	bookDescription:"",
	ButtonsBar:"",
	ShareButton:"",
	
	ThumbnailsButton:"",
	ThumbnailsButtonVisible:"Show",
	ZoomButton:"",
	ZoomButtonVisible:"Yes",
	FlashDisplaySettings:"",
	MainBgConfig:"",
	bgBeginColor:"#cccccc",
	bgEndColor:"#eeeeee",
	bgMRotation:45,
	pageBackgroundColor:"#FFFFFF",
	flipshortcutbutton:"Show",
	BookMargins:"",
	topMargin:10,
	bottomMargin:10,
	leftMargin:10,
	rightMargin:10,
	HTMLControlSettings:"",
	linkconfig:"",
	LinkDownColor:"#808080",
	LinkAlpha:0.5,
	OpenWindow:"_Blank",

	BookMarkButtonVisible:'true',
	productName : 'Demo created by Flip PDF',
	homePage : 'http://www.flipbuilder.com/',
	isFlipPdf : "true",
	TableOfContentButtonVisible:"true",
	searchTextJS:'javascript/search_config.js',
	searchPositionJS:undefined
};
	
	
	;bookConfig.BookTemplateName="metro";bookConfig.loadingCaption="Loading";bookConfig.loadingCaptionColor="#DDDDDD";bookConfig.loadingBackground="#E8E8E8";bookConfig.appLogoIcon="files/mobile-ext/appLogoIcon.png";bookConfig.appLogoOpenWindow="Blank";bookConfig.logoHeight="40";bookConfig.logoPadding="0";bookConfig.logoTop="0";bookConfig.toolbarColor="#000000";bookConfig.iconColor="#ECF5FB";bookConfig.pageNumColor="#333333";bookConfig.iconFontColor="#FFFFFF";bookConfig.toolbarAlwaysShow="No";bookConfig.InstructionsButtonVisible="Hide";bookConfig.showInstructionOnStart="No";bookConfig.QRCode="Hide";bookConfig.HomeButtonVisible="Hide";bookConfig.HomeURL="%first page%";bookConfig.enablePageBack="Show";bookConfig.ShareButtonVisible="Hide";bookConfig.EmailButtonVisible="Hide";bookConfig.btnShareWithEmailBody="{link}";bookConfig.ThumbnailsButtonVisible="Show";bookConfig.thumbnailColor="#333333";bookConfig.thumbnailAlpha="70";bookConfig.BookMarkButtonVisible="Hide";bookConfig.TableOfContentButtonVisible="Show";bookConfig.bookmarkBackground="#000000";bookConfig.bookmarkFontColor="#cccccc";bookConfig.SearchButtonVisible="Show";bookConfig.leastSearchChar="3";bookConfig.searchFontColor="#FFFFFF";bookConfig.searchHightlightColor="#ffff00";bookConfig.SelectTextButtonVisible="Show";bookConfig.PrintButtonVisible="Show";bookConfig.BackgroundSoundButtonVisible="Show";bookConfig.FlipSound="Yes";bookConfig.BackgroundSoundLoop="-1";bookConfig.AutoPlayButtonVisible="Show";bookConfig.autoPlayAutoStart="No";bookConfig.autoPlayDuration="9";bookConfig.autoPlayLoopCount="1";bookConfig.ZoomButtonVisible="Show";bookConfig.minZoomWidth="700";bookConfig.minZoomHeight="518";bookConfig.mouseWheelFlip="Yes";bookConfig.DownloadButtonVisible="Hide";bookConfig.PhoneButtonVisible="Hide";bookConfig.AnnotationButtonVisible="Show";bookConfig.FullscreenButtonVisible="Show";bookConfig.bgBeginColor="#E2E2E2";bookConfig.bgEndColor="#E2E2E2";bookConfig.bgMRotation="90";bookConfig.backGroundImgURL="files/mobile-ext/backGroundImgURL.jpg";bookConfig.backgroundPosition="stretch";bookConfig.backgroundOpacity="100";bookConfig.LeftShadowWidth="90";bookConfig.LeftShadowAlpha="0.6";bookConfig.RightShadowWidth="55";bookConfig.RightShadowAlpha="0.6";bookConfig.ShowTopLeftShadow="Yes";bookConfig.HardPageEnable="No";bookConfig.hardCoverBorderWidth="8";bookConfig.borderColor="#572F0D";bookConfig.outerCoverBorder="Yes";bookConfig.cornerRound="8";bookConfig.leftMarginOnMobile="0";bookConfig.topMarginOnMobile="0";bookConfig.rightMarginOnMobile="0";bookConfig.bottomMarginOnMobile="0";bookConfig.pageBackgroundColor="#E8E8E8";bookConfig.flipshortcutbutton="Show";bookConfig.BindingType="side";bookConfig.RightToLeft="No";bookConfig.flippingTime="0.6";bookConfig.retainBookCenter="Yes";bookConfig.FlipStyle="Flip";bookConfig.autoDoublePage="Yes";bookConfig.isTheBookOpen="No";bookConfig.thicknessWidthType="Thinner";bookConfig.thicknessColor="#ffffff";bookConfig.topMargin="10";bookConfig.bottomMargin="10";bookConfig.leftMargin="10";bookConfig.rightMargin="10";bookConfig.maxWidthToSmallMode="400";bookConfig.maxHeightToSmallMode="300";bookConfig.leftRightPnlShowOption="None";bookConfig.LinkDownColor="#800080";bookConfig.LinkAlpha="0.2";bookConfig.OpenWindow="Blank";bookConfig.showLinkHint="No";bookConfig.MidBgColor="#520691";bookConfig.searchFontColor="#FFFDDD";bookConfig.totalPageCount=197;bookConfig.largePageWidth=1800;bookConfig.largePageHeight=2491;;bookConfig.securityType="1";bookConfig.bookTitle="Osmanlıca 10 (Tüm Kitap)";bookConfig.bookmarkCR="c86bb5a98dac449477e53c65cb2999988dcbaa1a";bookConfig.productName="Flip PDF Professional";bookConfig.homePage="http://www.flipbuilder.com";bookConfig.searchPositionJS="mobile/javascript/text_position[1].js";bookConfig.searchTextJS="mobile/javascript/search_config.js";bookConfig.normalPath="files/mobile/";bookConfig.largePath="files/mobile/";bookConfig.thumbPath="files/thumb/";bookConfig.userListPath="files/extfiles/users.js";bookConfig.UIBaseURL='mobile/';var language = [{ language : "tr",btnFirstPage:"İlk",btnNextPage:"Sonraki Sayfa",btnLastPage:"Son",btnPrePage:"Önceki Sayfa",btnDownload:"İndir",btnPrint:"Yazdır",btnSearch:"Ara",btnClearSearch:"Temizle",frmSearchPrompt:"Clear",btnBookMark:"İçerik Tablosu",btnHelp:"Yardım",btnHome:"Home",btnFullScreen:"Tam Ekran Yap",btnDisableFullScreen:"Tam Ekrandan Çık",btnSoundOn:"Ses Aç",btnSoundOff:"Ses Kapa",btnShareEmail:"Paylaş",btnSocialShare:"Sosyalde Paylaş",btnZoomIn:"Yakınlaş",btnZoomOut:"Uzalaş",btnDragToMove:"Mause İle Taşı",btnAutoFlip:"Otomatik Geçiş",btnStopAutoFlip:"Otomatik Geçişini Durdur",btnGoToHome:"Anasayfaya Dön",frmHelpCaption:"Yardım",frmHelpTip1:"Çift Tıklama İle Yakınlaş/Uzaklaş",frmHelpTip2:"Görüntülemek İçin Sayfa Köşesini Sürükleyin",frmPrintCaption:"Yazdır",frmPrintBtnCaption:"Yazdır",frmPrintPrintAll:"Tüm Sayfaları Yazdır",frmPrintPrintCurrentPage:"Geçerli Sayfayı Yazdır",frmPrintPrintRange:"Yazdırma Aralığı",frmPrintExampleCaption:"Örnek: 2,5,8-26",frmPrintPreparePage:"Başlangıç Sayfası:",frmPrintPrintFailed:"Bitiş Sayfası:",pnlSearchInputInvalid:"(En Küçük Uzunluk 3 Karakter)",loginCaption:"Giriş",loginInvalidPassword:"Parola Geçersiz!",loginPasswordLabel:"Şifre:",loginBtnLogin:"Giriş",loginBtnCancel:"İptal",btnThumb:"Küçük Resimler",lblPages:"Sayfalar:",lblPagesFound:"Sayfalar:",lblPageIndex:"Sayfa",btnAbout:"Hakkında",frnAboutCaption:"Hakkında & İletişim",btnSinglePage:"Tekli Sayfa",btnDoublePage:"İkili Sayfa",btnSwicthLanguage:"Dil",tipChangeLanguage:"Lütfen Bir Dil Seçiniz...",btnMoreOptionsLeft:"Daha Fazla Ayar",btnMoreOptionsRight:"Daha Fazla Ayar",btnFit:"Ekrana Sığfır",smallModeCaption:"Tam Ekran Yap",btnAddAnnotation:"Açıklama Ekleyin",btnAnnotation:"Açıklamalar",FlipPageEditor_SaveAndExit:"Kaydet ve Çık",FlipPageEditor_Exit:"Çıkış",DrawToolWindow_Redo:"İleri Al",DrawToolWindow_Undo:"Geri Al",DrawToolWindow_Clear:"Temizle",DrawToolWindow_Brush:"Fırça",DrawToolWindow_Width:"Genişlik",DrawToolWindow_Alpha:"Görünürlük",DrawToolWindow_Color:"Renk",DrawToolWindow_Eraser:"Sil",DrawToolWindow_Rectangular:"Dikdörtgen",DrawToolWindow_Ellipse:"Daire",TStuff_BorderWidth:"Çizgi Genişliği",TStuff_BorderAlph:"Çizgi Görünürlüğü",TStuff_BorderColor:"Çizgi Rengi",DrawToolWindow_TextNote:"Yazı Notu",AnnotMark:"Kitap",lastpagebtnHelp:"Son Sayfa",firstpagebtnHelp:"İlk Sayfa",homebtnHelp:"Anasayfaya Dön",aboubtnHelp:"Hakkımızda",screenbtnHelp:"Uygulamayı Tam Ekranda Aç",helpbtnHelp:"Yardımı Aç",searchbtnHelp:"Sayfalarda Ara",pagesbtnHelp:"Kataloktaki Küçük Resimlere Göz At",bookmarkbtnHelp:"Kitaplığı Aç",AnnotmarkbtnHelp:"Tablo İçeriğini Aç",printbtnHelp:"Kataloğu Yazdır",soundbtnHelp:"Sesi Aç/Kapa",sharebtnHelp:"E-mail Gönder",socialSharebtnHelp:"Sosyalde Paylaş",zoominbtnHelp:"Yakınlaş",downloadbtnHelp:"Kataloğu İndir",pagemodlebtnHelp:"Tek ve Çift Sayfa Moduna Geçiş",languagebtnHelp:"Dil Değiş",annotationbtnHelp:"Açıklamalar Ekle",addbookmarkbtnHelp:"Kitaplık Ekle",removebookmarkbtnHelp:"Kitaplık Kaldır",updatebookmarkbtnHelp:"Kitaplığı Güncelle",btnShoppingCart:"Card Kullan",Help_ShoppingCartbtn:"Card Kullant",Help_btnNextPage:"Sonraki Sayfa",Help_btnPrePage:"Önceki Sayfa",Help_btnAutoFlip:"Otomatik Oynat",Help_StopAutoFlip:"Otomatik Oynatmayı Durdur",btnaddbookmark:"Ekle",btndeletebookmark:"Sil",btnupdatebookmark:"Güncelle",frmyourbookmarks:"Sizin Kitaplık",frmitems:"Ürün",DownloadFullPublication:"Tam Yayın",DownloadCurrentPage:"Geçerli Sayfa",DownloadAttachedFiles:"Ekli Dosyalar",lblLink:"Link",btnCopy:"Kopyala",infCopyToClipboard:"Your browser does not support clipboard. ",restorePage:"Önceki Oturumu Geri Yüklemek İstermisiniz",tmpl_Backgoundsoundon:"Arkaplan Sesini Aç",tmpl_Backgoundsoundoff:"Arkaplan Sesini Kapat",tmpl_Flipsoundon:"Sesi Aç",tmpl_Flipsoundoff:"Sesi Kapa",Help_PageIndex:"Geçerli Sayfa Numarası",tmpl_PrintPageRanges:"SAYFA YILDIZLARI",tmpl_PrintPreview:"ÖNİZLEME",btnSelection:"Yazıyı Seç",loginNameLabel:"İsim:",btnGotoPage:"Git",btnSettings:"Ayarlar",soundSettingTitle:"Ses Ayarları",closeFlipSound:"Sesi Kapat",closeBackgroundSound:"Arkaplan Sesini Kapar",frmShareCaption:"Paylaş",frmShareLinkLabel:"Link:",frmShareBtnCopy:"Kopyala",frmShareItemsGroupCaption:"Sosyalde Paylaş",TAnnoActionPropertyStuff_GotoPage:"Sayfaya Git",btnPageBack:"Geri",btnPageForward:"İleri",SelectTextCopy:"Yazıyı Kopyala",selectCopyButton:"Kopyala",TStuffCart_TypeCart:"Kart Kullan",TStuffCart_DetailedQuantity:"Kalite",TStuffCart_DetailedPrice:"Fiyat",ShappingCart_Close:"Kapat",ShappingCart_CheckOut:"Çıkış Yap",ShappingCart_Item:"Ürün",ShappingCart_Total:"Toplam",ShappingCart_AddCart:"Kart Ekle",ShappingCart_InStock:"Stokta Var",TStuffCart_DetailedCost:"Nakliye Makiyeti",TStuffCart_DetailedTime:"Teslimat Süresi",TStuffCart_DetailedDay:"gün",ShappingCart_NotStock:"Stokta Yok",btnCrop:"Kırp",btnDragButton:"Sürükle",btnFlipBook:"E-Book",btnSlideMode:"Slide Mod",btnSinglePageMode:"Tekli Sayfa Modu",btnVertical:"Dikey Mod",btnHotizontal:"Yattay Mod",btnClose:"Kapat",btnDoublePage:"İkili Sayfa",btnBookStatus:"Kitaba Bak",checkBoxInsert:"Geçerli Sayfa Girin",lblLast:"Son Sayfa.",lblFirst:"İlk Sayfa.",lblFullscreen:"Tam Ekran Yapmak İçin Tıklayınız.",lblName:"İsim",lblPassword:"Şifre",lblLogin:"Giriş",lblCancel:"İptal",lblNoName:"Kullanıcı Adı Bulunamadı.",lblNoPassword:"Geçerli şifre değil.",lblNoCorrectLogin:"Lütfen Geçerli Kullanıcı Adı ve Şifre Giriniz.",btnVideo:"Video Galeri",btnSlideShow:"Slide Göster",pnlSearchInputInvalid:"(En Küçük Uzunluk 3 Karakter)",btnDragToMove:"Mause İle Taşı",btnPositionToMove:"Mause Konumuna Göre Taşı",lblHelp1:"Görüntülemek İçin Sayfa Köşesinden Sürükleyin",lblHelp2:"Çift Tıkla Yakınlaş/Uzaklaş",lblCopy:"Kopyala",lblAddToPage:"Sayfa Ekle",lblPage:"Sayfa",lblTitle:"Başlık",lblEdit:"Düzenle",lblDelete:"Sil",lblRemoveAll:"Tümünü Sil",tltCursor:"Cursor",tltAddHighlight:"Vurgu Ekle",tltAddTexts:"Yazı Ekle",tltAddShapes:"Şekil Ekle",tltAddNotes:"Not Ekle",tltAddImageFile:"Resim Ekle",tltAddSignature:"İmza Ekle",tltAddLine:"Çizgi Ekle",tltAddArrow:"Ok Ekle",tltAddRect:"Rect Ekle",tltAddEllipse:"Daire Ekle",lblDoubleClickToZoomIn:"Yakınlaşmak İçin Çift Tıklayınız.",frmShareCaption:"Paylaş",frmShareLabel:"Share",frmShareInfo:"You can easily share this publication to social networks.Just cilck the appropriate button below.",frminsertLabel:"Insert to Site",frminsertInfo:"Use the code below to embed this publication to your website.",btnQRCode:"Click to scan QR code",btnRotateLeft:"Rotate Left",btnRotateRight:"Rotate Right",lblSelectMode:"Select view mode please.",frmDownloadPreview:"Preview",frmHowToUse:"How To Use",lblHelpPage1:"Move your finger to flip the book page.",lblHelpPage2:"Zoom in by using gesture or double click on the page.",lblHelpPage3:"Click on the logo to reach the official website of the company.",lblHelpPage4:"Add bookmarks, use search function and auto flip the book.",lblHelpPage5:"Switch horizontal and vertical view on mobile devices.",TTActionQuiz_PlayAgain:"Do you wanna play it again",TTActionQuiz_Ration:"Your ratio is",frmTelephone:"Telephone list",btnDialing:"Dialing",lblSelectMessage:"Please copy the the text content in the text box",btnSelectText:"Select Text",btnNote:"Annotation",btnPhoneNumber:"Telephone"}];;function orgt(s){ return binl2hex(core_hx(str2binl(s), s.length * chrsz));};; var pageEditor = {"setting":{"annoPlaying":"true","shoppingCartHTML":"false","shoppingCartOptinon":{"type":"PayPal","paypal":"","method":"POST","sandbox":"false","address":"","theme":"","body":"Hi xxx<br/>   I\'m going to buy below product(s):<br/>    ${shopping}<br/>Full Name","showPrice":"true","showTime":"true"}}, "pageAnnos":[[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]}; bookConfig.isFlipPdf=false;
	bookConfig.hideMiniFullscreen=true;
	if(language&&language.length>0&&language[0]&&language[0].language){
		bookConfig.language=language[0].language;
	}
	
try{
	for(var i=0;pageEditor!=undefined&&i<pageEditor.length;i++){
		if(pageEditor[i].length==0){
			continue;
		}
		for(var j=0;j<pageEditor[i].length;j++){
			var anno=pageEditor[i][j];
			if(anno==undefined)continue;
			if(anno.overAlpha==undefined){
				anno.overAlpha=bookConfig.LinkAlpha;
			}
			if(anno.outAlpha==undefined){
				anno.outAlpha=0;
			}
			if(anno.downAlpha==undefined){
				anno.downAlpha=bookConfig.LinkAlpha;
			}
			if(anno.overColor==undefined){
				anno.overColor=bookConfig.LinkDownColor;
			}
			if(anno.downColor==undefined){
				anno.downColor=bookConfig.LinkDownColor;
			}
			if(anno.outColor==undefined){
				anno.outColor=bookConfig.LinkDownColor;
			}
			if(anno.annotype=='com.mobiano.flipbook.pageeditor.TAnnoLink'){
				anno.alpha=bookConfig.LinkAlpha;
			}
		}
	}
}catch(e){
}
try{
	$.browser.device = 2;
}catch(ee){
}