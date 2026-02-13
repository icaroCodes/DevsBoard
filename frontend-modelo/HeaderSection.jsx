import image from "./image.png";
import image1 from "./image.svg";
import line18 from "./line-18.svg";

export const HeaderSection = () => {
  const navigationItems = [
    { label: "Recursos", marginLeft: "ml-[235px]" },
    { label: "Benefícios", marginLeft: "ml-14" },
  ];

  return (
    <header className="absolute top-[19px] left-0 w-[1280px] h-[85px] flex flex-col gap-[5px]">
      <div className="ml-[54px] w-[1203px] h-20 relative">
        <div className="left-[3px] h-20 absolute top-0 w-[1200px]">
          <nav
            className="left-0 h-[148px] flex absolute top-0 w-[1200px]"
            aria-label="Main navigation"
          >
            <img
              className="absolute top-2 left-0 w-[50px] h-[50px]"
              alt="DevsBoard Logo"
              src={image}
            />

            <h1 className="flex items-center justify-center mt-[17px] w-[136px] h-9 ml-[61px] [font-family:'DM_Sans-Medium',Helvetica] font-medium text-accentaccent-4 text-3xl tracking-[-1.50px] leading-[36.0px] whitespace-nowrap">
              DevsBoard
            </h1>

            {navigationItems.map((item, index) => (
              <a
                key={index}
                href={`#${item.label.toLowerCase()}`}
                className={`mt-[22px] w-[107px] h-[22px] ${item.marginLeft} text-[#040404] text-xl [font-family:'Poppins-Medium',Helvetica] font-medium tracking-[0] leading-[normal] whitespace-nowrap hover:opacity-80 transition-opacity`}
              >
                {item.label}
              </a>
            ))}

            <button
              className="mt-2.5 w-[157px] h-12 relative ml-[336px] inline-flex items-center justify-center gap-0.5 px-[22px] py-3.5 bg-[#485c10] rounded-[1000px] hover:bg-[#5a7314] transition-colors focus:outline-none focus:ring-2 focus:ring-[#485c10] focus:ring-offset-2"
              aria-label="Começar Grátis"
            >
              <span className="relative w-fit mt-[-1.00px] font-link font-[number:var(--link-font-weight)] text-texton-accent-1 text-[length:var(--link-font-size)] text-center tracking-[var(--link-letter-spacing)] leading-[var(--link-line-height)] whitespace-nowrap [font-style:var(--link-font-style)]">
                Começar Grátis
              </span>

              <span
                className="flex w-[7px] items-center gap-2.5 relative self-stretch"
                aria-hidden="true"
              >
                <img
                  className="relative w-1.5 h-[6.01px] aspect-[1]"
                  alt=""
                  src={image1}
                />
              </span>
            </button>

            <a
              href="#entrar"
              className="absolute top-6 left-[973px] font-link font-[number:var(--link-font-weight)] text-[#323a33] text-[length:var(--link-font-size)] text-center tracking-[var(--link-letter-spacing)] leading-[var(--link-line-height)] whitespace-nowrap [font-style:var(--link-font-style)] hover:opacity-80 transition-opacity"
            >
              Entrar
            </a>
          </nav>
        </div>
      </div>

      <img
        className="w-[1280px] h-px object-cover"
        alt=""
        src={line18}
        role="presentation"
      />
    </header>
  );
};
