import svgPaths from "./svg-kqs04cd19o";
import imgLogoImage from "../assets/fca2071bbd5e866b34884ba36dfd685964d24b47.png";
import imgImage from "../assets/1352f162da52bebf85330249593a4f24b0f7d037.png";
import imgImage1 from "../assets/645be3125f3e5f631423a05a520c1cc8c295554b.png";
import imgImage2 from "../assets/7f03fc01bccfb9da5887d4de41822988c444dd14.png";
import imgImgMap from "../assets/654fbbb19d54a2e3f2616b9e2cc089d0dad6552c.png";
import imgImgMap1 from "../assets/0da2dba8a451cff7503cbc8d25297125ecc1249a.png";
import imgImgMap2 from "../assets/7e4deb782dae559953b69d86a10007bc367c937c.png";
import imgImgProfile from "../assets/a5496bed0226780b21a0fda5e2b448a06b4b31f3.png";
import imgImgProfile1 from "../assets/81a3cc16a07da8ccd7785c48ed72d98a474be138.png";
import imgImgProfile2 from "../assets/e2550974c0fc18ecc04173968b5a7cdb4eacc065.png";
import imgImgProfile3 from "../assets/82e8fad710caac30d5e66406d64fd868406ed518.png";
import imgImgDescr from "../assets/270e84f2c6561b96d084945bb687de635934997a.png";
import imgImgDescr1 from "../assets/7f87dc49ba985aa98948a8cbd411e7b7df260658.png";
import imgImgDescr2 from "../assets/dd826f068906f7b8b5377d4cecef83cbef99ca99.png";
import imgImgIcon from "../assets/7ffcc99820741013d338fce26ffbe362ac1524e6.png";
import imgIconAcademia from "../assets/88e1cea7fb5ed844d7100615ae005c56da91830b.png";
import imgIconAbroad from "../assets/ab1ba0ca8259aa0990769111eee0e42932e98ed8.png";
import imgIconBanter from "../assets/923b6766850447dea35de6587c8d6c2db60af5f6.png";
import imgIconTech from "../assets/c96c2df01d63ed94b01231c19999d0d368a452c8.png";
import imgIconAction from "../assets/41a4fd434fd4336d79a6043529de276f139bc24b.png";
import imgImgBg from "../assets/a9c707fda1e04875d9792464409e06070fb4a13f.png";
import imgContainerImg from "../assets/161d8d24bd33143a1de51bee3873c99728e0dfc1.png";
import imgImgProfile4 from "../assets/1cbd7a12730b5265576540335d9be977c1c66004.png";
import imgImgProfile5 from "../assets/fc4c587cbeabc13a27de43491d71361b66dfbd5e.png";
import imgImgProfile6 from "../assets/7d5766d0548fe131f8a921b6919660eb2a02c3ec.png";
import imgImgProfile7 from "../assets/7949ac22e55b4a4a6c86d7bacc36ede8364f8783.png";
import imgImgBanner from "../assets/2dfd1f6abbce08c727ac442f43fa5b25baee9b40.png";
import imgImage4 from "../assets/5d864b66e48294c1469a39a0e10eed287ce1d50e.png";
import imgImage3 from "../assets/80c92e52d04ca843d99da9d4285287279e432045.png";
import imgImage5 from "../assets/0eceb99aba132ace104a544cdde00449de11932b.png";
import imgImage6 from "../assets/3f2ec3e0f336b3340453983c84c011a205a4c943.png";
import imgImgLogo from "../assets/95ea1c99f2023fdea415cd4a3ad3d3d8dbc48ae2.png";

function LogoImage() {
  return (
    <div className="h-[64px] relative shrink-0 w-[192px]" data-name="logo-image">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgLogoImage} />
    </div>
  );
}

function NavLink() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[101px]" data-name="nav-link">
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1d1d1d] text-[21px] text-nowrap">
        <p className="leading-[1.2] whitespace-pre">home</p>
      </div>
    </div>
  );
}

function NavLink1() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[101px]" data-name="nav-link">
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1d1d1d] text-[21px] text-nowrap">
        <p className="leading-[1.2] whitespace-pre">about us</p>
      </div>
    </div>
  );
}

function NavLink2() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[101px]" data-name="nav-link">
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1d1d1d] text-[21px] text-nowrap">
        <p className="leading-[1.2] whitespace-pre">contact</p>
      </div>
    </div>
  );
}

function PrimaryBtn() {
  return (
    <div className="bg-[#783fc6] box-border content-stretch flex items-center justify-between px-[16px] py-[8px] relative rounded-[8px] shrink-0 w-[218px]" data-name="primary-btn">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f9f9f9] text-[21px] text-nowrap tracking-[3.99px]">
        <p className="leading-[1.2] whitespace-pre">EPISODES</p>
      </div>
    </div>
  );
}

function ContainerNavigation() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-[569px]" data-name="container-navigation">
      <NavLink />
      <NavLink1 />
      <NavLink2 />
      <PrimaryBtn />
    </div>
  );
}

function ComponentHeader() {
  return (
    <div className="backdrop-blur-[2px] backdrop-filter relative shrink-0 w-full" data-name="component-header">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex items-center justify-between px-[40px] py-[20px] relative w-full">
          <LogoImage />
          <ContainerNavigation />
        </div>
      </div>
    </div>
  );
}

function MainCta() {
  return (
    <div className="bg-[#783fc6] box-border content-stretch flex gap-[8px] items-center justify-center px-[24px] py-[16px] relative rounded-[8px] self-stretch shrink-0" data-name="main-cta">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f9f9f9] text-[36px] text-nowrap tracking-[7.2px]">
        <p className="leading-[1.2] whitespace-pre">LISTEN NOW</p>
      </div>
    </div>
  );
}

function Image() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="Image">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-[-14.29%] max-w-none size-[128.57%] top-[-14.29%]" src={imgImage} />
      </div>
    </div>
  );
}

function Spotify() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0" data-name="spotify">
      <Image />
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1d1d1d] text-[12px] text-nowrap">
        <p className="leading-[1.2] whitespace-pre">SPOTIFY</p>
      </div>
    </div>
  );
}

function Image1() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="Image">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-[-6.25%] max-w-none size-[112.5%] top-[-6.25%]" src={imgImage1} />
      </div>
    </div>
  );
}

function ApplePod() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0" data-name="apple-pod">
      <Image1 />
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[1.2] not-italic relative shrink-0 text-[#1d1d1d] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="mb-0">{`APPLE `}</p>
        <p>PODCASTS</p>
      </div>
    </div>
  );
}

function Image2() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="Image">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[138.46%] left-[-16.67%] max-w-none top-[-17.31%] w-[133.33%]" src={imgImage2} />
      </div>
    </div>
  );
}

function PodAddict() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative shrink-0" data-name="pod-addict">
      <Image2 />
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[1.2] not-italic relative shrink-0 text-[#1d1d1d] text-[12px] text-center text-nowrap whitespace-pre">
        <p className="mb-0">{`PODCAST `}</p>
        <p>ADDICT</p>
      </div>
    </div>
  );
}

function BtnCta() {
  return (
    <div className="content-stretch flex gap-[16px] items-start justify-center relative shrink-0" data-name="btn-cta">
      <MainCta />
      <Spotify />
      <ApplePod />
      <PodAddict />
    </div>
  );
}

function ContainerHook() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-start relative shrink-0 w-[708px]" data-name="container-hook">
      <div className="flex flex-col font-['Bender:Black',_sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#1d1d1d] text-[0px] w-[min-content]">
        <p className="leading-[1.2] text-[61px]">
          <span>{`Amplifying African tech stories `}</span>
          <span className="text-[#8dc63f]">{`&`}</span>
          <span>{` building tech brilliance.`}</span>
        </p>
      </div>
      <p className="font-['Bender:Bold',_sans-serif] leading-[1.2] not-italic relative shrink-0 text-[#1d1d1d] text-[27px] w-[708px]">
        <span>{`Catalysing `}</span>
        <span className="text-[#783fc6]">spiritual</span>
        <span>{`, `}</span>
        <span className="text-[#783fc6]">social</span>
        <span>{` and `}</span>
        <span className="text-[#783fc6]">economic</span>
        <span>{` renewal in our immediate communities and as a result the world`}</span>
      </p>
      <BtnCta />
    </div>
  );
}

function ContainerGraphic() {
  return (
    <div className="box-border gap-[8px] grid grid-cols-[repeat(3,_minmax(0px,_1fr))] grid-rows-[repeat(3,_minmax(0px,_1fr))] h-[705px] min-h-[480px] min-w-[480px] overflow-clip p-[16px] relative shrink-0 w-[706px]" data-name="container-graphic">
      <div className="[grid-area:1_/_1] aspect-[813/813] relative shrink-0" data-name="img-map">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImgMap} />
      </div>
      <div className="[grid-area:2_/_2] aspect-[813/813] relative shrink-0" data-name="img-map">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImgMap1} />
      </div>
      <div className="[grid-area:3_/_3] aspect-[813/813] relative shrink-0" data-name="img-map">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImgMap2} />
      </div>
      <div className="[grid-area:1_/_2] aspect-[100/100] relative shrink-0" data-name="img-profile">
        <img alt="" className="block max-w-none size-full" height="219.333" src={imgImgProfile} width="219.333" />
      </div>
      <div className="[grid-area:2_/_1] aspect-[100/100] relative shrink-0" data-name="img-profile">
        <img alt="" className="block max-w-none size-full" height="219.333" src={imgImgProfile1} width="219.333" />
      </div>
      <div className="[grid-area:3_/_2] aspect-[100/100] relative shrink-0" data-name="img-profile">
        <img alt="" className="block max-w-none size-full" height="219.333" src={imgImgProfile2} width="219.333" />
      </div>
      <div className="[grid-area:2_/_3] aspect-[100/100] relative shrink-0" data-name="img-profile">
        <img alt="" className="block max-w-none size-full" height="219.333" src={imgImgProfile3} width="219.333" />
      </div>
    </div>
  );
}

function SectionHero() {
  return (
    <div className="relative shrink-0 w-full" data-name="section-hero">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-center flex flex-wrap items-center justify-between px-[40px] py-[32px] relative w-full">
          <ContainerHook />
          <ContainerGraphic />
        </div>
      </div>
    </div>
  );
}

function ContainerImgstrip() {
  return (
    <div className="content-stretch flex gap-[48px] items-start relative shrink-0" data-name="container-imgstrip">
      <div className="relative shrink-0 size-[587px]" data-name="img-descr">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute bg-[#d9d9d9] inset-0" />
          <img alt="" className="absolute max-w-none object-50%-50% object-cover size-full" src={imgImgDescr} />
        </div>
      </div>
      <div className="relative shrink-0 size-[587px]" data-name="img-descr">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute bg-[#d9d9d9] inset-0" />
          <img alt="" className="absolute max-w-none object-50%-50% object-cover size-full" src={imgImgDescr1} />
        </div>
      </div>
      <div className="relative shrink-0 size-[587px]" data-name="img-descr">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute bg-[#d9d9d9] inset-0" />
          <img alt="" className="absolute max-w-none object-50%-50% object-cover size-full" src={imgImgDescr2} />
        </div>
      </div>
      <div className="bg-[#d9d9d9] shrink-0 size-[587px]" data-name="img-descr" />
    </div>
  );
}

function SectionIntroduction() {
  return (
    <div className="relative shrink-0 w-full" data-name="section-introduction">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[48px] items-start px-[40px] py-[72px] relative w-full">
          <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[47px] text-black w-[829px]">
            <p className="leading-[1.2]">Geohabari Podcast focuses on telling African tech stories by engaging the pioneers and jauganuts who have trodded the path.</p>
          </div>
          <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[47px] text-black w-[829px]">
            <p className="leading-[1.2]">We talk to industry experts, designers, founders, aspiring professionals and students</p>
          </div>
          <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[47px] text-black w-[829px]">
            <p className="leading-[1.2]">Empowering the african genius in every space.</p>
          </div>
          <ContainerImgstrip />
        </div>
      </div>
    </div>
  );
}

function ContainerHeading() {
  return (
    <div className="box-border content-stretch flex font-['Bender:Bold',_sans-serif] gap-[16px] items-end justify-end leading-[0] not-italic overflow-clip px-0 py-[9px] relative shrink-0 text-[#1d1d1d] w-full" data-name="container-heading">
      <div className="flex flex-col justify-center leading-[1.2] relative shrink-0 text-[47px] w-[466px]">
        <p className="mb-0">{`With conversations `}</p>
        <p>that cut across the board in ...</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[27px] text-justify w-[467px]">
        <p className="leading-[1.2]">It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.</p>
      </div>
    </div>
  );
}

function ContainterTheme() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] items-start leading-[0] left-1/2 not-italic text-[#1d1d1d] top-[calc(50%+190.5px)] translate-x-[-50%] translate-y-[-50%] w-[272px]" data-name="containter-theme">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center relative shrink-0 text-[47px] w-full">
        <p className="leading-[1.2]">CAREER</p>
      </div>
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center relative shrink-0 text-[16px] w-full">
        <p className="leading-[1.2]">Navigate diverse career paths in the geospatial industry. Discussing pivotal moments, key learnings, and challenges, these episodes inspire you to explore new career horizons.</p>
      </div>
    </div>
  );
}

function ImgIcon() {
  return (
    <div className="absolute left-[220px] size-[72px] top-[49px]" data-name="img-icon">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImgIcon} />
    </div>
  );
}

function ComponentTheme() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[48px] items-center justify-end overflow-clip px-[16px] py-[32px] relative rounded-[24px] shrink-0 size-[346px]" data-name="component-theme" style={{ backgroundImage: "linear-gradient(90deg, rgba(249, 249, 249, 0.7) 0%, rgba(249, 249, 249, 0.7) 100%), linear-gradient(90deg, rgb(139, 139, 139) 0%, rgb(139, 139, 139) 100%)" }}>
      <ContainterTheme />
      <ImgIcon />
    </div>
  );
}

function ContainterTheme1() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] items-start leading-[0] left-1/2 not-italic text-[#1d1d1d] top-[calc(50%+190.5px)] translate-x-[-50%] translate-y-[-50%] w-[272px]" data-name="containter-theme">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center relative shrink-0 text-[47px] w-full">
        <p className="leading-[1.2]">ACADEMIA</p>
      </div>
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center relative shrink-0 text-[16px] w-full">
        <p className="leading-[1.2] whitespace-pre-wrap">{`Discover African organizations leading in geo-enabling and   other cutting-edge technologies. We dive into the  systems' components, from programming languages to seamless integrations, showcasing impactful use cases across the continent.`}</p>
      </div>
    </div>
  );
}

function IconAcademia() {
  return (
    <div className="relative shrink-0 size-[72px]" data-name="icon_academia">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgIconAcademia} />
    </div>
  );
}

function ComponentTheme1() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[48px] items-end overflow-clip px-[16px] py-[32px] relative rounded-[24px] shrink-0 size-[346px]" data-name="component-theme" style={{ backgroundImage: "linear-gradient(90deg, rgba(249, 249, 249, 0.7) 0%, rgba(249, 249, 249, 0.7) 100%), linear-gradient(90deg, rgb(139, 139, 139) 0%, rgb(139, 139, 139) 100%)" }}>
      <ContainterTheme1 />
      <IconAcademia />
    </div>
  );
}

function ContainterTheme2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] items-start leading-[0] left-1/2 not-italic text-[#1d1d1d] top-[calc(50%+190.5px)] translate-x-[-50%] translate-y-[-50%] w-[272px]" data-name="containter-theme">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center relative shrink-0 text-[47px] w-full">
        <p className="leading-[1.2]">STUDY ABROAD</p>
      </div>
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center relative shrink-0 text-[16px] w-full">
        <p className="leading-[1.2]">Scholarship recipients share their application tips and tricks, covering everything from requirements to living abroad. The ultimate starter pack for geospatial students looking to study overseas.</p>
      </div>
    </div>
  );
}

function IconAbroad() {
  return (
    <div className="relative shrink-0 size-[72px]" data-name="icon_abroad">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgIconAbroad} />
    </div>
  );
}

function ComponentTheme2() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[48px] items-end overflow-clip px-[16px] py-[32px] relative rounded-[24px] shrink-0 size-[346px]" data-name="component-theme" style={{ backgroundImage: "linear-gradient(90deg, rgba(249, 249, 249, 0.7) 0%, rgba(249, 249, 249, 0.7) 100%), linear-gradient(90deg, rgb(139, 139, 139) 0%, rgb(139, 139, 139) 100%)" }}>
      <ContainterTheme2 />
      <IconAbroad />
    </div>
  );
}

function ContainterTheme3() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] items-start leading-[0] left-1/2 not-italic text-[#1d1d1d] top-[calc(50%+190.5px)] translate-x-[-50%] translate-y-[-50%] w-[272px]" data-name="containter-theme">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center relative shrink-0 text-[47px] w-full">
        <p className="leading-[1.2]">BANTER</p>
      </div>
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center relative shrink-0 text-[16px] w-full">
        <p className="leading-[1.2]">Blend technical expertise with humor to humanize experiences in the tech world. Ideal for those looking for a light-hearted, tech-centric laugh.</p>
      </div>
    </div>
  );
}

function IconBanter() {
  return (
    <div className="relative shrink-0 size-[72px]" data-name="icon_banter">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgIconBanter} />
    </div>
  );
}

function ComponentTheme3() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[48px] items-end overflow-clip px-[16px] py-[32px] relative rounded-[24px] shrink-0 size-[346px]" data-name="component-theme" style={{ backgroundImage: "linear-gradient(90deg, rgba(249, 249, 249, 0.7) 0%, rgba(249, 249, 249, 0.7) 100%), linear-gradient(90deg, rgb(139, 139, 139) 0%, rgb(139, 139, 139) 100%)" }}>
      <ContainterTheme3 />
      <IconBanter />
    </div>
  );
}

function ContainterTheme4() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] items-start leading-[0] left-1/2 not-italic text-[#1d1d1d] top-[calc(50%+190.5px)] translate-x-[-50%] translate-y-[-50%] w-[272px]" data-name="containter-theme">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center relative shrink-0 text-[47px] w-full">
        <p className="leading-[1.2]">EARTH</p>
      </div>
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center relative shrink-0 text-[16px] w-full">
        <p className="leading-[1.2]">Dive into Earth Observation (EO) use cases across various sectors. From technical tools and datasets to real-world applications and impacts, each episode offers a comprehensive look at EO’s potential.</p>
      </div>
    </div>
  );
}

function IconBanter1() {
  return (
    <div className="relative shrink-0 size-[72px]" data-name="icon_banter">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgIconBanter} />
    </div>
  );
}

function ComponentTheme4() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[48px] items-end overflow-clip px-[16px] py-[32px] relative rounded-[24px] shrink-0 size-[346px]" data-name="component-theme" style={{ backgroundImage: "linear-gradient(90deg, rgba(249, 249, 249, 0.7) 0%, rgba(249, 249, 249, 0.7) 100%), linear-gradient(90deg, rgb(139, 139, 139) 0%, rgb(139, 139, 139) 100%)" }}>
      <ContainterTheme4 />
      <IconBanter1 />
    </div>
  );
}

function ContainterTheme5() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] items-start leading-[0] left-1/2 not-italic text-[#1d1d1d] top-[calc(50%+190.5px)] translate-x-[-50%] translate-y-[-50%] w-[272px]" data-name="containter-theme">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center relative shrink-0 text-[47px] w-full">
        <p className="leading-[1.2]">TECH</p>
      </div>
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center relative shrink-0 text-[16px] w-full">
        <p className="leading-[1.2] whitespace-pre-wrap">{`Discover African organizations leading in geo-enabling and   other cutting-edge technologies. We dive into the  systems' components, from programming languages to seamless integrations, showcasing impactful use cases across the continent.`}</p>
      </div>
    </div>
  );
}

function IconTech() {
  return (
    <div className="relative shrink-0 size-[72px]" data-name="icon_tech">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgIconTech} />
    </div>
  );
}

function ComponentTheme5() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[48px] items-end overflow-clip px-[16px] py-[32px] relative rounded-[24px] shrink-0 size-[346px]" data-name="component-theme" style={{ backgroundImage: "linear-gradient(90deg, rgba(249, 249, 249, 0.7) 0%, rgba(249, 249, 249, 0.7) 100%), linear-gradient(90deg, rgb(139, 139, 139) 0%, rgb(139, 139, 139) 100%)" }}>
      <ContainterTheme5 />
      <IconTech />
    </div>
  );
}

function ContainterTheme6() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] items-start leading-[0] left-1/2 not-italic text-[#1d1d1d] top-[calc(50%+190.5px)] translate-x-[-50%] translate-y-[-50%] w-[272px]" data-name="containter-theme">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center relative shrink-0 text-[47px] w-full">
        <p className="leading-[1.2]">ACTION</p>
      </div>
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[1.2] relative shrink-0 text-[16px] w-full">
        <p className="mb-0">Explore how tech is used across Africa to drive change. Highlighting limitless possibilities, we showcase how GIS is leveraged for impactful solutions in different industries.</p>
        <p>&nbsp;</p>
      </div>
    </div>
  );
}

function IconAction() {
  return (
    <div className="relative shrink-0 size-[72px]" data-name="icon_action">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgIconAction} />
    </div>
  );
}

function ComponentTheme6() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[48px] items-end overflow-clip px-[16px] py-[32px] relative rounded-[24px] shrink-0 size-[346px]" data-name="component-theme" style={{ backgroundImage: "linear-gradient(90deg, rgba(249, 249, 249, 0.7) 0%, rgba(249, 249, 249, 0.7) 100%), linear-gradient(90deg, rgb(139, 139, 139) 0%, rgb(139, 139, 139) 100%)" }}>
      <ContainterTheme6 />
      <IconAction />
    </div>
  );
}

function ContainerThemes() {
  return (
    <div className="content-end flex flex-wrap gap-[16px] items-end relative shrink-0 w-full" data-name="container-themes">
      <ComponentTheme />
      <ComponentTheme1 />
      <ComponentTheme2 />
      <ComponentTheme3 />
      <ComponentTheme4 />
      <ComponentTheme5 />
      <ComponentTheme6 />
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[47px] text-black w-[292px]">
        <p className="leading-[1.2]">And so much more ....</p>
      </div>
    </div>
  );
}

function SectionTopics() {
  return (
    <div className="relative shrink-0 w-full" data-name="section-topics">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[48px] items-start px-[40px] py-[72px] relative w-full">
          <div className="absolute blur filter h-[1200px] left-[-177px] top-0 w-[1851px]" data-name="img-bg">
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
              <img alt="" className="absolute max-w-none object-50%-50% object-cover size-full" src={imgImgBg} />
              <div className="absolute bg-[rgba(249,249,249,0.2)] inset-0" />
            </div>
          </div>
          <ContainerHeading />
          <ContainerThemes />
        </div>
      </div>
    </div>
  );
}

function ContainerIntro() {
  return (
    <div className="content-stretch flex flex-col h-full items-start justify-between leading-[0] not-italic relative shrink-0 text-black text-justify w-[450px]" data-name="container-intro">
      <div className="flex flex-col font-['Bender:Black',_sans-serif] justify-center relative shrink-0 text-[61px] w-full">
        <p className="leading-[1.2]">
          <span>{`New Episodes every week on `}</span>
          <span className="text-[#783fc6]">Monday</span>{" "}
        </p>
      </div>
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center relative shrink-0 text-[27px] w-full">
        <p className="leading-[1.2]">Here is this weeks episode, dive in and catch a glimpse of what we are all about ...</p>
      </div>
    </div>
  );
}

function ContainerImg() {
  return (
    <div className="relative shrink-0 size-[225px]" data-name="container-img">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgContainerImg} />
    </div>
  );
}

function BtnGotoEp() {
  return (
    <div className="bg-[#8dc63f] box-border content-stretch flex gap-[10px] items-center justify-center overflow-clip px-[24px] py-[8px] relative rounded-[8px] shrink-0" data-name="btn-gotoEp">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f9f9f9] text-[27px] text-nowrap">
        <p className="leading-[1.2] whitespace-pre">Go to Episode</p>
      </div>
    </div>
  );
}

function EpisodeDetails() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-end justify-end relative shrink-0 w-[467px]" data-name="episode-details">
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#8dc63f] text-[21px] w-[min-content]">
        <p className="leading-[1.2]">LATEST EPISODE #S2E04</p>
      </div>
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#1d1d1d] text-[36px] w-[min-content]">
        <p className="leading-[1.2]">The Space Economy Playbook</p>
      </div>
      <BtnGotoEp />
    </div>
  );
}

function ContainerDetails() {
  return (
    <div className="box-border content-stretch flex items-center justify-between px-0 py-px relative shrink-0 w-full" data-name="container-details">
      <ContainerImg />
      <EpisodeDetails />
    </div>
  );
}

function PlayerProgress() {
  return (
    <div className="bg-[#8b8b8b] content-stretch flex flex-col gap-[10px] items-start justify-center relative rounded-[1000px] shrink-0 w-full" data-name="player-progress">
      <div className="bg-[#bfa0e6] h-[4px] rounded-[1000px] shrink-0 w-[98px]" data-name="progress-bar" />
    </div>
  );
}

function ActionPlay() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="action-play">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="action-play">
          <path d={svgPaths.pd2d7200} fill="var(--fill-0, #F9F9F9)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function PlayerAction() {
  return (
    <div className="bg-[#bfa0e6] box-border content-stretch flex gap-[10px] items-center px-[19px] py-0 relative rounded-[35px] shrink-0 size-[70px]" data-name="player-action">
      <ActionPlay />
    </div>
  );
}

function ContainerControls() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full" data-name="container-controls">
      <PlayerProgress />
      <PlayerAction />
    </div>
  );
}

function ComponentPlayer() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[708px]" data-name="component-player">
      <ContainerDetails />
      <ContainerControls />
    </div>
  );
}

function SectionLatestep() {
  return (
    <div className="box-border content-stretch flex gap-[32px] items-end overflow-clip px-0 py-[32px] relative shrink-0" data-name="section-latestep">
      <div className="flex flex-row items-end self-stretch">
        <ContainerIntro />
      </div>
      <ComponentPlayer />
    </div>
  );
}

function ContainerDetails1() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start justify-center leading-[0] not-italic relative shrink-0 w-[704px]" data-name="container-details">
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center relative shrink-0 text-[#8dc63f] text-[21px] text-nowrap">
        <p className="leading-[1.2] whitespace-pre">UP NEXT #S2E05</p>
      </div>
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center min-w-full relative shrink-0 text-[#f9f9f9] text-[27px] w-[min-content]">
        <p className="leading-[1.2]">The Young Professionals Segment: The Geospatial Journey No One Prepares You For.</p>
      </div>
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center relative shrink-0 text-[#8dc63f] text-[21px] text-nowrap">
        <p className="leading-[1.2] whitespace-pre">RELEASING ON: 26-05-2025</p>
      </div>
    </div>
  );
}

function ContainerProfiles() {
  return (
    <div className="content-stretch flex gap-[44px] items-center relative shrink-0" data-name="container-profiles">
      <div className="flex flex-row items-center self-stretch">
        <div className="aspect-[100/100] h-full relative shrink-0" data-name="img-profile">
          <img alt="" className="block max-w-none size-full" height="100" src={imgImgProfile4} width="100" />
        </div>
      </div>
      <div className="flex flex-row items-center self-stretch">
        <div className="aspect-[100/100] h-full relative shrink-0" data-name="img-profile">
          <img alt="" className="block max-w-none size-full" height="100" src={imgImgProfile5} width="100" />
        </div>
      </div>
      <div className="flex flex-row items-center self-stretch">
        <div className="aspect-[100/100] h-full relative shrink-0" data-name="img-profile">
          <img alt="" className="block max-w-none size-full" height="100" src={imgImgProfile6} width="100" />
        </div>
      </div>
    </div>
  );
}

function SectionNextep() {
  return (
    <div className="bg-[#783fc6] relative shrink-0 w-full" data-name="section-nextep">
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-center flex flex-wrap gap-[53px] items-center justify-center px-[67px] py-[32px] relative w-full">
          <div className="absolute left-0 size-[240px] top-1/2 translate-y-[-50%]" data-name="img-map">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImgMap2} />
          </div>
          <div className="absolute right-0 size-[240px] top-1/2 translate-y-[-50%]" data-name="img-map">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImgMap1} />
          </div>
          <div className="relative shrink-0 size-[160px]" data-name="img-profile">
            <img alt="" className="block max-w-none size-full" height="160" src={imgImgProfile7} width="160" />
          </div>
          <ContainerDetails1 />
          <ContainerProfiles />
        </div>
      </div>
    </div>
  );
}

function ContainerText() {
  return (
    <div className="content-stretch flex gap-[32px] items-start leading-[1.2] not-italic relative shrink-0" data-name="container-text">
      <p className="font-['Bender:Black',_sans-serif] relative shrink-0 text-[#1d1d1d] text-[80px] text-nowrap whitespace-pre">EPISODES</p>
      <p className="font-['Bender:Bold',_sans-serif] relative shrink-0 text-[27px] text-black w-[452px]">{`From our archives for you to knock yourself out with or binge or share with someone you think would enjoy `}</p>
    </div>
  );
}

function FormkitArrowleft() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="formkit:arrowleft">
      <div className="absolute inset-[-37.5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 84 84">
          <g filter="url(#filter0_d_1_579)" id="formkit:arrowleft">
            <rect fill="var(--fill-0, #F9F9F9)" height="48" rx="24" width="48" x="18" y="18" />
            <rect height="47" rx="23.5" stroke="var(--stroke-0, #8B8B8B)" strokeOpacity="0.5" width="47" x="18.5" y="18.5" />
            <path d={svgPaths.p31c1b1b0} fill="var(--fill-0, #1D1D1D)" id="Union" />
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="84" id="filter0_d_1_579" width="84" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="effect1_dropShadow_1_579" />
              <feOffset />
              <feGaussianBlur stdDeviation="7" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.545098 0 0 0 0 0.545098 0 0 0 0 0.545098 0 0 0 0.2 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_579" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_579" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function FormkitArrowright() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="formkit:arrowright">
      <div className="absolute inset-[-37.5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 84 84">
          <g filter="url(#filter0_d_1_574)" id="formkit:arrowright">
            <rect fill="var(--fill-0, #F9F9F9)" height="48" rx="24" width="48" x="18" y="18" />
            <rect height="47" rx="23.5" stroke="var(--stroke-0, #8B8B8B)" strokeOpacity="0.5" width="47" x="18.5" y="18.5" />
            <path d={svgPaths.p17802830} fill="var(--fill-0, #1D1D1D)" id="Union" />
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="84" id="filter0_d_1_574" width="84" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="effect1_dropShadow_1_574" />
              <feOffset />
              <feGaussianBlur stdDeviation="7" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.545098 0 0 0 0 0.545098 0 0 0 0 0.545098 0 0 0 0.2 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_574" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_574" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function ContainerNavigation1() {
  return (
    <div className="box-border content-stretch flex gap-[32px] items-center justify-center p-[16px] relative shrink-0" data-name="container-navigation">
      <FormkitArrowleft />
      <FormkitArrowright />
    </div>
  );
}

function ContainerIntro1() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="container-intro">
      <ContainerText />
      <ContainerNavigation1 />
    </div>
  );
}

function EpisodeNumber() {
  return (
    <div className="content-stretch flex font-['Bender:Bold',_sans-serif] gap-[13px] items-start leading-[1.2] not-italic relative shrink-0 text-[27px] text-black text-nowrap whitespace-pre" data-name="episode-number">
      <p className="relative shrink-0">Season 02</p>
      <p className="relative shrink-0">Episode 09</p>
    </div>
  );
}

function EpisodeDescription() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start leading-[1.2] not-italic relative shrink-0 w-full" data-name="episode-description">
      <p className="font-['Bender:Bold',_sans-serif] min-w-full relative shrink-0 text-[#1d1d1d] text-[47px] w-[min-content]">The Episode Title in a short form</p>
      <p className="font-['Bender:Regular',_sans-serif] relative shrink-0 text-[16px] text-black w-[383px]">{`The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.`}</p>
    </div>
  );
}

function EpisodeDetails1() {
  return (
    <div className="content-stretch flex flex-col gap-[23px] items-start relative shrink-0 w-full" data-name="episode-details">
      <EpisodeNumber />
      <EpisodeDescription />
    </div>
  );
}

function PrimaryBtn1() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0" data-name="primary-btn">
      <div aria-hidden="true" className="absolute border-2 border-[#783fc6] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1d1d1d] text-[21px] text-nowrap">
        <p className="leading-[1.2] whitespace-pre">LISTEN NOW</p>
      </div>
    </div>
  );
}

function ContainerDetails2() {
  return (
    <div className="content-stretch flex flex-col h-[380px] items-start justify-between relative shrink-0 w-[401px]" data-name="container-details">
      <EpisodeDetails1 />
      <PrimaryBtn1 />
    </div>
  );
}

function ComponentEpisode() {
  return (
    <div className="bg-[#f9f9f9] relative rounded-[12px] shrink-0" data-name="component-episode">
      <div className="box-border content-stretch flex gap-[34px] items-start overflow-clip px-[32px] py-[24px] relative rounded-[inherit]">
        <div className="relative rounded-[16px] shrink-0 size-[400px]" data-name="img-banner">
          <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[16px] size-full" src={imgImgBanner} />
        </div>
        <ContainerDetails2 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(139,139,139,0.2)] border-solid inset-[-0.5px] pointer-events-none rounded-[12.5px] shadow-[0px_0px_14px_4px_rgba(152,110,211,0.15)]" />
    </div>
  );
}

function EpisodeNumber1() {
  return (
    <div className="content-stretch flex font-['Bender:Bold',_sans-serif] gap-[13px] items-start leading-[1.2] not-italic relative shrink-0 text-[27px] text-black text-nowrap whitespace-pre" data-name="episode-number">
      <p className="relative shrink-0">Season 02</p>
      <p className="relative shrink-0">Episode 09</p>
    </div>
  );
}

function EpisodeDescription1() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start leading-[1.2] not-italic relative shrink-0 w-full" data-name="episode-description">
      <p className="font-['Bender:Bold',_sans-serif] min-w-full relative shrink-0 text-[#1d1d1d] text-[47px] w-[min-content]">The Episode Title in a short form</p>
      <p className="font-['Bender:Regular',_sans-serif] relative shrink-0 text-[16px] text-black w-[383px]">{`The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.`}</p>
    </div>
  );
}

function EpisodeDetails2() {
  return (
    <div className="content-stretch flex flex-col gap-[23px] items-start relative shrink-0 w-full" data-name="episode-details">
      <EpisodeNumber1 />
      <EpisodeDescription1 />
    </div>
  );
}

function PrimaryBtn2() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0" data-name="primary-btn">
      <div aria-hidden="true" className="absolute border-2 border-[#783fc6] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1d1d1d] text-[21px] text-nowrap">
        <p className="leading-[1.2] whitespace-pre">LISTEN NOW</p>
      </div>
    </div>
  );
}

function ContainerDetails3() {
  return (
    <div className="content-stretch flex flex-col h-[380px] items-start justify-between relative shrink-0 w-[401px]" data-name="container-details">
      <EpisodeDetails2 />
      <PrimaryBtn2 />
    </div>
  );
}

function ComponentEpisode1() {
  return (
    <div className="bg-[#f9f9f9] blur filter relative rounded-[12px] shrink-0" data-name="component-episode">
      <div className="box-border content-stretch flex gap-[34px] items-start overflow-clip px-[32px] py-[24px] relative rounded-[inherit]">
        <div className="relative rounded-[16px] shrink-0 size-[400px]" data-name="img-banner">
          <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[16px] size-full" src={imgImgBanner} />
        </div>
        <ContainerDetails3 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(139,139,139,0.2)] border-solid inset-[-0.5px] pointer-events-none rounded-[12.5px] shadow-[0px_0px_14px_4px_rgba(152,110,211,0.15)]" />
    </div>
  );
}

function ContainerEpisodes() {
  return (
    <div className="content-stretch flex gap-[48px] items-center justify-center relative shrink-0" data-name="container-episodes">
      <ComponentEpisode />
      <ComponentEpisode1 />
    </div>
  );
}

function ContainerCrumbs() {
  return (
    <div className="relative shrink-0 w-full" data-name="container-crumbs">
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[32px] items-center justify-center px-[257px] py-[9px] relative w-full">
          <div className="relative shrink-0 size-[8px]" data-name="icon-idle">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
              <circle cx="4" cy="4" fill="var(--fill-0, #8B8B8B)" id="icon-idle" r="4" />
            </svg>
          </div>
          <div className="relative shrink-0 size-[8px]" data-name="icon-idle">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
              <circle cx="4" cy="4" fill="var(--fill-0, #8B8B8B)" id="icon-idle" r="4" />
            </svg>
          </div>
          <div className="relative shrink-0 size-[12px]" data-name="icon-active">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
              <circle cx="6" cy="6" fill="var(--fill-0, #1D1D1D)" id="icon-active" r="6" />
            </svg>
          </div>
          <div className="relative shrink-0 size-[8px]" data-name="icon-idle">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
              <circle cx="4" cy="4" fill="var(--fill-0, #8B8B8B)" id="icon-idle" r="4" />
            </svg>
          </div>
          <div className="relative shrink-0 size-[8px]" data-name="icon-idle">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
              <circle cx="4" cy="4" fill="var(--fill-0, #8B8B8B)" id="icon-idle" r="4" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionRecenteps() {
  return (
    <div className="h-[836px] relative shrink-0 w-full" data-name="section-recenteps">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] h-[836px] items-start justify-center px-[40px] py-[32px] relative w-full">
          <ContainerIntro1 />
          <ContainerEpisodes />
          <ContainerCrumbs />
        </div>
      </div>
    </div>
  );
}

function FormkitArrowleft1() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="formkit:arrowleft">
      <div className="absolute inset-[-37.5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 84 84">
          <g filter="url(#filter0_d_1_579)" id="formkit:arrowleft">
            <rect fill="var(--fill-0, #F9F9F9)" height="48" rx="24" width="48" x="18" y="18" />
            <rect height="47" rx="23.5" stroke="var(--stroke-0, #8B8B8B)" strokeOpacity="0.5" width="47" x="18.5" y="18.5" />
            <path d={svgPaths.p31c1b1b0} fill="var(--fill-0, #1D1D1D)" id="Union" />
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="84" id="filter0_d_1_579" width="84" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="effect1_dropShadow_1_579" />
              <feOffset />
              <feGaussianBlur stdDeviation="7" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.545098 0 0 0 0 0.545098 0 0 0 0 0.545098 0 0 0 0.2 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_579" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_579" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function FormkitArrowright1() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="formkit:arrowright">
      <div className="absolute inset-[-37.5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 84 84">
          <g filter="url(#filter0_d_1_574)" id="formkit:arrowright">
            <rect fill="var(--fill-0, #F9F9F9)" height="48" rx="24" width="48" x="18" y="18" />
            <rect height="47" rx="23.5" stroke="var(--stroke-0, #8B8B8B)" strokeOpacity="0.5" width="47" x="18.5" y="18.5" />
            <path d={svgPaths.p17802830} fill="var(--fill-0, #1D1D1D)" id="Union" />
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="84" id="filter0_d_1_574" width="84" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="effect1_dropShadow_1_574" />
              <feOffset />
              <feGaussianBlur stdDeviation="7" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.545098 0 0 0 0 0.545098 0 0 0 0 0.545098 0 0 0 0.2 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_574" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_574" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function ContainerNavigation2() {
  return (
    <div className="box-border content-stretch flex gap-[32px] items-center justify-center p-[16px] relative shrink-0" data-name="container-navigation">
      <FormkitArrowleft1 />
      <FormkitArrowright1 />
    </div>
  );
}

function ContainerIntro2() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-end overflow-clip p-[10px] relative self-stretch shrink-0 w-[457px]" data-name="container-intro">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#1d1d1d] text-[47px] w-[min-content]">
        <p className="leading-[1.2]">Statements that reorganized our brain chemistry ... “</p>
      </div>
      <div className="flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#1d1d1d] text-[0px] w-[min-content]">
        <p className="leading-[1.2]">
          <span className="font-['Bender:Regular',_sans-serif] not-italic text-[21px]">{`"Don’t ever underestimate the power of your words. Just one voice can change the hearts and minds of people."`}</span>
          <span className="text-[16px]">
            <br aria-hidden="true" />
          </span>
          <span className="font-['Bender:Italic',_sans-serif] italic text-[16px]">{` — Barack Obama`}</span>
        </p>
      </div>
      <ContainerNavigation2 />
    </div>
  );
}

function ImgQuote() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-between overflow-clip relative rounded-[16px] shadow-[0px_0px_14px_4px_rgba(139,139,139,0.2)] shrink-0 size-[372px]" data-name="img-quote">
      <div className="aspect-[1080/1080] relative shrink-0 w-full" data-name="image 4">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage4} />
      </div>
    </div>
  );
}

function ImgQuote1() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center overflow-clip relative rounded-[16px] shadow-[0px_0px_14px_4px_rgba(139,139,139,0.2)] shrink-0 w-[372px]" data-name="img-quote">
      <div className="aspect-[1080/1080] basis-0 grow min-h-px min-w-px relative shrink-0" data-name="image 3">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage3} />
      </div>
    </div>
  );
}

function ImgQuote2() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-center overflow-clip relative rounded-[16px] shadow-[0px_0px_14px_4px_rgba(139,139,139,0.2)] shrink-0 w-[372px]" data-name="img-quote">
      <div className="relative shrink-0 size-[372px]" data-name="image 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage5} />
      </div>
    </div>
  );
}

function ImgQuote3() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center overflow-clip relative rounded-[16px] shadow-[0px_0px_14px_4px_rgba(139,139,139,0.2)] shrink-0 w-[372px]" data-name="img-quote">
      <div className="aspect-[1080/1080] basis-0 grow min-h-px min-w-px relative shrink-0" data-name="image 2">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage6} />
      </div>
    </div>
  );
}

function ContainerCards() {
  return (
    <div className="basis-0 content-stretch flex gap-[32px] grow items-center justify-center min-h-px min-w-px overflow-clip relative shrink-0" data-name="container-cards">
      <ImgQuote />
      <ImgQuote1 />
      <ImgQuote2 />
      <ImgQuote3 />
    </div>
  );
}

function SectionQuotes() {
  return (
    <div className="relative shrink-0 w-full" data-name="section-quotes">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[16px] items-start px-[40px] py-[32px] relative w-full">
          <ContainerIntro2 />
          <ContainerCards />
        </div>
      </div>
    </div>
  );
}

function ContainerPrompt() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[10px] grow items-start leading-[1.2] min-h-px min-w-px not-italic relative shrink-0 text-[#1d1d1d]" data-name="container-prompt">
      <p className="font-['Bender:Black',_sans-serif] relative shrink-0 text-[80px] w-full">WE ARE BUILDING A COMMUNITY ...</p>
      <p className="font-['Bender:Bold',_sans-serif] relative shrink-0 text-[47px] w-full">And you can join countless others in this glorious purpose that is bigger than any one person by signing up for our newsletters and events.</p>
    </div>
  );
}

function InputName() {
  return (
    <div className="bg-[#f9f9f9] h-[87px] relative shrink-0 w-full" data-name="input-name">
      <div aria-hidden="true" className="absolute border-[#8dc63f] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[36px] h-[87px] items-start px-[32px] py-[16px] relative w-full">
          <p className="font-['Bender:Bold',_sans-serif] leading-[1.2] not-italic relative shrink-0 text-[#8b8b8b] text-[27px] text-nowrap whitespace-pre">Full Name</p>
        </div>
      </div>
    </div>
  );
}

function InputEmail() {
  return (
    <div className="bg-[#f9f9f9] h-[95px] relative shrink-0 w-full" data-name="input-email">
      <div aria-hidden="true" className="absolute border-[#8dc63f] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[36px] h-[95px] items-start px-[32px] py-[16px] relative w-full">
          <p className="font-['Bender:Bold',_sans-serif] leading-[1.2] not-italic relative shrink-0 text-[#8b8b8b] text-[27px] text-nowrap whitespace-pre">Email Address</p>
        </div>
      </div>
    </div>
  );
}

function PrimaryBtn3() {
  return (
    <div className="bg-[#783fc6] box-border content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0" data-name="primary-btn">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f9f9f9] text-[27px] text-nowrap">
        <p className="leading-[1.2] whitespace-pre">SIGN ME UP</p>
      </div>
    </div>
  );
}

function ContainerForm() {
  return (
    <div className="box-border content-stretch flex flex-col h-[483px] items-center justify-between overflow-clip px-[16px] py-[24px] relative shrink-0 w-[663px]" data-name="container-form">
      <InputName />
      <InputEmail />
      <PrimaryBtn3 />
    </div>
  );
}

function SectionNewsletter() {
  return (
    <div className="backdrop-blur-[2.5px] backdrop-filter basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="section-newsletter">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-center flex flex-wrap gap-[16px] items-center justify-center px-[40px] py-0 relative size-full">
          <ContainerPrompt />
          <ContainerForm />
        </div>
      </div>
    </div>
  );
}

function ContainerLogo() {
  return (
    <div className="relative shrink-0 w-full" data-name="container-logo">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-center justify-center p-[10px] relative w-full">
          <div className="h-[103px] relative shrink-0 w-[327px]" data-name="img-logo">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImgLogo} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContainerDescription() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center justify-center min-w-[360px] relative shrink-0" data-name="container-description">
      <ContainerLogo />
      <p className="font-['Bender:Bold',_sans-serif] leading-[1.2] not-italic relative shrink-0 text-[#f9f9f9] text-[27px] text-center w-[529px]">Geohabari is an African tech podcast that celebrates innovations fosters community engagement among geospatial professionals, and explores impactful technologies. 🎙️🌍🔍</p>
    </div>
  );
}

function NavLinks() {
  return (
    <div className="content-stretch flex flex-col font-['Bender:Regular',_sans-serif] gap-[23px] items-center justify-center leading-[1.2] not-italic relative shrink-0 text-[#8dc63f] text-[21px] text-center w-full" data-name="nav links">
      <p className="min-w-full relative shrink-0 w-[min-content]">HOME</p>
      <p className="relative shrink-0 text-nowrap whitespace-pre">CONTACT</p>
      <p className="relative shrink-0 text-nowrap whitespace-pre">ABOUT US</p>
      <p className="relative shrink-0 text-nowrap whitespace-pre">EPISODES</p>
    </div>
  );
}

function Emails() {
  return (
    <div className="content-stretch flex flex-col gap-[23px] items-center justify-center leading-[1.2] not-italic relative shrink-0 text-center text-nowrap w-full whitespace-pre" data-name="emails">
      <p className="font-['Bender:Bold',_sans-serif] relative shrink-0 text-[#f9f9f9] text-[36px]">Reach Out</p>
      <p className="font-['Bender:Regular',_sans-serif] relative shrink-0 text-[#8dc63f] text-[21px]">yariwo@geohabari.com</p>
      <p className="font-['Bender:Regular',_sans-serif] relative shrink-0 text-[#8dc63f] text-[21px]">info@geohabari.com</p>
    </div>
  );
}

function ContainerLinks() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-center justify-center min-w-[280px] relative shrink-0" data-name="container-links">
      <NavLinks />
      <Emails />
    </div>
  );
}

function Image3() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="Image">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid box-border inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgImage} />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border size-[48px]" />
    </div>
  );
}

function Image4() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="Image">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid box-border inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgImage1} />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border size-[48px]" />
    </div>
  );
}

function Image5() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="Image">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid box-border inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgImage2} />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border size-[48px]" />
    </div>
  );
}

function SubPlatforms() {
  return (
    <div className="h-[48px] relative shrink-0 w-[176px]" data-name="sub-platforms">
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[16px] h-[48px] items-start pl-0 pr-[1086.64px] py-0 relative w-[176px]">
          <Image3 />
          <Image4 />
          <Image5 />
        </div>
      </div>
    </div>
  );
}

function Subscribe() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center justify-center relative shrink-0 w-[389.333px]" data-name="subscribe">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#f9f9f9] text-[27px] text-center w-[min-content]">
        <p className="leading-[1.2]">SUBSCRIBE</p>
      </div>
      <SubPlatforms />
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-[12px] size-[24px] top-[2.48px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.p1c00500} fill="var(--fill-0, #F9F9F9)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function LinkFooterLinkNe5H() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="Link [Footer_link__NE5H5]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border relative size-[48px]">
        <div className="absolute flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[0] left-[-7.16px] not-italic text-[#f9f9f9] text-[12px] text-nowrap top-[36.47px] translate-y-[-50%]">
          <p className="leading-[1.2] whitespace-pre">X(Twitter)</p>
        </div>
        <Icon />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute h-[24px] left-[13.5px] top-[2.48px] w-[21px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 24">
        <g id="Icon">
          <path d={svgPaths.p303ef300} fill="var(--fill-0, #F9F9F9)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function LinkFooterLinkNe5H1() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="Link [Footer_link__NE5H5]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border relative size-[48px]">
        <div className="absolute flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[0] left-[-2.39px] not-italic text-[#f9f9f9] text-[12px] text-nowrap top-[36.47px] translate-y-[-50%]">
          <p className="leading-[1.2] whitespace-pre">LinkedIn</p>
        </div>
        <Icon1 />
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="absolute h-[24px] left-[13.5px] top-[2.48px] w-[21px]" data-name="Icon">
      <div className="absolute bottom-0 left-[-0.02%] right-[-0.04%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22 24">
          <g id="Icon">
            <path d={svgPaths.pb3c8b00} fill="var(--fill-0, #F9F9F9)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function LinkFooterLinkNe5H2() {
  return (
    <div className="relative shrink-0 size-[48px]" data-name="Link [Footer_link__NE5H5]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border relative size-[48px]">
        <div className="absolute flex flex-col font-['Bender:Regular',_sans-serif] justify-center leading-[0] left-[-6.52px] not-italic text-[#f9f9f9] text-[12px] text-nowrap top-[36.47px] translate-y-[-50%]">
          <p className="leading-[1.2] whitespace-pre">Instagram</p>
        </div>
        <Icon2 />
      </div>
    </div>
  );
}

function SubSocials() {
  return (
    <div className="h-[48px] relative shrink-0 w-[182.49px]" data-name="sub-socials">
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[13.609px] h-[48px] items-start pl-[5.609px] pr-[1083.39px] py-0 relative w-[182.49px]">
          <LinkFooterLinkNe5H />
          <LinkFooterLinkNe5H1 />
          <LinkFooterLinkNe5H2 />
        </div>
      </div>
    </div>
  );
}

function Socials() {
  return (
    <div className="content-stretch flex flex-col gap-[32px] items-center justify-center relative shrink-0 w-[389.333px]" data-name="socials">
      <div className="flex flex-col font-['Bender:Bold',_sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#f9f9f9] text-[27px] text-center w-[min-content]">
        <p className="leading-[1.2]">FOLLOW US</p>
      </div>
      <SubSocials />
    </div>
  );
}

function ContainerSocials() {
  return (
    <div className="content-stretch flex flex-col gap-[32px] items-center justify-center min-w-[300px] relative shrink-0" data-name="container-socials">
      <Subscribe />
      <Socials />
    </div>
  );
}

function ComponentFooter() {
  return (
    <div className="bg-[#783fc6] relative shrink-0 w-full" data-name="component-footer">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-center flex flex-wrap gap-[8px] items-center justify-between px-[40px] py-[24px] relative w-full">
          <ContainerDescription />
          <ContainerLinks />
          <ContainerSocials />
        </div>
      </div>
    </div>
  );
}

export default function PageHomeDesktop() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex flex-col items-center relative size-full" data-name="page-home-desktop">
      <ComponentHeader />
      <SectionHero />
      <SectionIntroduction />
      <SectionTopics />
      <SectionLatestep />
      <SectionNextep />
      <SectionRecenteps />
      <SectionQuotes />
      <SectionNewsletter />
      <ComponentFooter />
    </div>
  );
}