import { CallToActionSection } from "./CallToActionSection";
import { FeaturesAndBenefitsSection } from "./FeaturesAndBenefitsSection";
import { HeaderSection } from "./HeaderSection";
import line19 from "./line-19.svg";
import line20 from "./line-20.svg";
import line21 from "./line-21.svg";
import line22 from "./line-22.svg";
import vector2 from "./vector-2.svg";
import vector3 from "./vector-3.svg";
import vector4 from "./vector-4.svg";
import vector8 from "./vector-8.svg";
import vector9 from "./vector-9.svg";
import vector10 from "./vector-10.svg";
import vector11 from "./vector-11.svg";
import vector12 from "./vector-12.svg";
import vector13 from "./vector-13.svg";
import vector14 from "./vector-14.svg";
import vector15 from "./vector-15.svg";

export const Desktop = () => {
  const whyChooseItems = [
    {
      title: "TUDO EM UM SÓ LUGAR",
      icon: vector8,
      arrowIcon: vector9,
      lineImage: line19,
      top: "1590px",
      lineTop: "1649px",
      iconTop: "1592px",
      arrowTop: "1599px",
    },
    {
      title: "FOCO E FLUXO PARA DEVS",
      icon: vector11,
      arrowIcon: vector10,
      lineImage: line20,
      top: "1672px",
      lineTop: "1733px",
      iconTop: "1674px",
      arrowTop: "1681px",
    },
    {
      title: "DEVSBOARD: SUA BASE SÓLIDA",
      icon: vector13,
      arrowIcon: vector12,
      lineImage: line21,
      top: "1755px",
      lineTop: "1814px",
      iconTop: "1757px",
      arrowTop: "1764px",
    },
    {
      title: "PROJETOS ORGANIZADOS",
      icon: vector15,
      arrowIcon: vector14,
      lineImage: line22,
      top: "1825px",
      lineTop: "1884px",
      iconTop: "1827px",
      arrowTop: "1834px",
    },
  ];

  return (
    <main className="relative w-[1280px] h-[2423px] bg-[#f5f5dc]">
      <HeaderSection />

      <div
        className="absolute top-[104px] left-0 w-[1280px] h-10 bg-[#8e9c78]"
        role="banner"
      >
        <p className="absolute top-[13px] left-[464px] [font-family:'Inter-Bold',Helvetica] font-bold text-white text-base text-center tracking-[0] leading-[14.4px] whitespace-nowrap">
          Acelere sua produtividade no Devsboard 🚀
        </p>
      </div>

      <FeaturesAndBenefitsSection />

      <div
        className="absolute top-[959px] left-[186px] w-[30px] h-[30px] flex"
        aria-hidden="true"
      >
        <div className="w-[30px] h-[30px] relative">
          <img
            className="absolute w-[79.17%] h-[75.00%] top-[12.50%] left-[12.50%]"
            alt=""
            src={vector2}
          />
        </div>
      </div>

      <div
        className="absolute top-[960px] left-[545px] w-[30px] h-[30px]"
        aria-hidden="true"
      >
        <img
          className="absolute w-[79.17%] h-[75.00%] top-[12.50%] left-[12.50%]"
          alt=""
          src={vector3}
        />
      </div>

      <div
        className="absolute top-[950px] left-[900px] w-[30px] h-[30px]"
        aria-hidden="true"
      >
        <img
          className="absolute w-[75.00%] h-[83.33%] top-[8.33%] left-[12.50%]"
          alt=""
          src={vector4}
        />
      </div>

      <CallToActionSection />

      <section
        className="absolute top-[1477px] left-0 w-[1280px] h-[600px] bg-[#0e3b44]"
        aria-labelledby="why-choose-heading"
      >
        <h2
          id="why-choose-heading"
          className="absolute top-[94px] left-14 w-[406px] [font-family:'Poppins-Medium',Helvetica] font-medium text-white text-5xl tracking-[0] leading-[normal]"
        >
          Por que escolher
        </h2>

        <div className="absolute top-[155px] left-14 w-[250px] [font-family:'Poppins-Medium',Helvetica] font-medium text-[#b47045] text-[40px] tracking-[0] leading-[normal] whitespace-nowrap">
          DevsBoard?
        </div>

        {whyChooseItems.map((item, index) => (
          <div key={index}>
            <p
              className="absolute left-[693px] w-[482px] [font-family:'Poppins-Medium',Helvetica] font-medium text-white text-[32px] tracking-[0] leading-[normal]"
              style={{ top: item.top }}
            >
              {item.title}
            </p>

            <div
              className="absolute left-[1181px] w-[30px] h-[30px] rotate-[90.00deg]"
              style={{ top: item.arrowTop }}
              aria-hidden="true"
            >
              <img
                className="absolute w-[25.00%] h-[50.00%] top-[37.50%] left-[25.00%] rotate-[-90.00deg]"
                alt=""
                src={item.arrowIcon}
              />
            </div>

            <div
              className="absolute left-[638px] w-10 h-10"
              style={{ top: item.iconTop }}
              aria-hidden="true"
            >
              <img
                className="absolute w-[83.33%] h-[83.33%] top-[8.33%] left-[8.33%]"
                alt=""
                src={item.icon}
              />
            </div>

            <img
              className="absolute left-[641px] w-[570px] h-px object-cover"
              alt=""
              src={item.lineImage}
              style={{ top: item.lineTop }}
            />
          </div>
        ))}
      </section>
    </main>
  );
};
