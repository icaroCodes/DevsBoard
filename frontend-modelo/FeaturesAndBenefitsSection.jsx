import frame1 from "./frame-1.png";
import image2 from "./image-2.svg";
import image3 from "./image-3.svg";
import rectangle536 from "./rectangle-536.png";
import rectangle537 from "./rectangle-537.png";
import rectangle538 from "./rectangle-538.png";
import rectangle539 from "./rectangle-539.png";
import rectangle540 from "./rectangle-540.png";
import rectangle541 from "./rectangle-541.png";
import vector5 from "./vector-5.svg";
import vector6 from "./vector-6.svg";
import vector7 from "./vector-7.svg";

export const FeaturesAndBenefitsSection = () => {
  const stats = [
    { value: "20", suffix: "+", label: "Clientes", leftPosition: "291px" },
    { value: "100", suffix: "%", label: "Gratuito", leftPosition: "547px" },
    { value: "0", suffix: "", label: "Anúncios", leftPosition: "804px" },
  ];

  const features = [
    {
      title: "Finanças",
      description:
        "Gerencie receitas, despesas e tenha visão clara do seu dinheiro.",
      image: rectangle536,
      icon: vector5,
      iconWidth: "75.00%",
      iconHeight: "83.33%",
      iconTop: "8.33%",
      iconLeft: "12.50%",
      top: "634px",
      left: "110px",
      titleTop: "731px",
      titleLeft: "132px",
      descTop: "785px",
      descLeft: "152px",
      circleTop: "659px",
      circleLeft: "132px",
      iconContainerTop: "958px",
      iconContainerLeft: "147px",
    },
    {
      title: "Tarefas",
      description: "Organize tarefas com prioridades e status.",
      image: rectangle537,
      icon: vector6,
      iconWidth: "83.33%",
      iconHeight: "70.83%",
      iconTop: "12.50%",
      iconLeft: "8.33%",
      top: "634px",
      left: "468px",
      titleTop: "730px",
      titleLeft: "493px",
      descTop: "792px",
      descLeft: "507px",
      circleTop: "661px",
      circleLeft: "490px",
      iconContainerTop: "960px",
      iconContainerLeft: "505px",
    },
    {
      title: "Rotinas",
      description: "Crie rotinas e acompanhe hábitos no dia a dia.",
      image: rectangle538,
      icon: vector7,
      iconWidth: "83.33%",
      iconHeight: "66.67%",
      iconTop: "16.67%",
      iconLeft: "8.33%",
      top: "634px",
      left: "826px",
      titleTop: "717px",
      titleLeft: "846px",
      descTop: "792px",
      descLeft: "869px",
      circleTop: "650px",
      circleLeft: "846px",
      iconContainerTop: "960px",
      iconContainerLeft: "861px",
    },
  ];

  const bottomFeatures = [
    {
      title: "Metas",
      description:
        "Defina metas financeiras e metas de desempenho e acompanhe seu progresso.",
      image: rectangle539,
      top: "915px",
      left: "110px",
      titleTop: "1012px",
      titleLeft: "134px",
      descTop: "1066px",
      descLeft: "147px",
      circleTop: "943px",
      circleLeft: "132px",
    },
    {
      title: "Projetos",
      description: "Planeje e organize projetos de forma simples.",
      image: rectangle540,
      top: "915px",
      left: "468px",
      titleTop: "1014px",
      titleLeft: "490px",
      descTop: "1066px",
      descLeft: "505px",
      circleTop: "945px",
      circleLeft: "490px",
    },
    {
      title: "Open Source",
      description: "Projeto aberto para issues, PRs e contribuições.",
      image: rectangle541,
      top: "915px",
      left: "826px",
      titleTop: "1014px",
      titleLeft: "846px",
      descTop: "1072px",
      descLeft: "859px",
      circleTop: "945px",
      circleLeft: "846px",
    },
  ];

  const buttons = [
    { label: "Benefícios", left: "468px", image: image2 },
    { label: "Entrar", left: "603px", image: image3 },
  ];

  return (
    <section className="absolute top-[284px] left-10 w-[1200px] h-[1993px]">
      <div className="absolute w-full top-[1427px] left-0 h-[464px] flex border-t-[0.5px] [border-top-style:solid] border-dividersdivider-1">
        <footer className="mt-[472px] w-[1200px] h-[230px] flex bg-transparent border-t [border-top-style:solid] [border-right-style:none] [border-bottom-style:none] [border-left-style:none] border-[#e8e8e8]">
          <div className="mt-40 w-[1200px] flex">
            <img
              className="w-[50px] h-[50px]"
              alt="DevsBoard Logo"
              src={frame1}
            />

            <div className="flex items-center justify-center mt-[32.6px] w-[114px] h-[17px] ml-[13px] font-captions font-[number:var(--captions-font-weight)] text-textcaptions text-[length:var(--captions-font-size)] tracking-[var(--captions-letter-spacing)] leading-[var(--captions-line-height)] whitespace-nowrap [font-style:var(--captions-font-style)]">
              © 2026 DevsBoard
            </div>

            <div className="mt-[32.6px] w-[1110px] ml-[839px] flex">
              <div className="flex items-center justify-center w-48 h-[17px] font-captions font-[number:var(--captions-font-weight)] text-textcaptions text-[length:var(--captions-font-size)] tracking-[var(--captions-letter-spacing)] leading-[var(--captions-line-height)] whitespace-nowrap [font-style:var(--captions-font-style)]">
                Desenvolvido por IcaroCodes
              </div>
            </div>
          </div>
        </footer>
      </div>

      {buttons.map((button, index) => (
        <button
          key={index}
          className={`inline-flex items-center justify-center gap-0.5 px-[22px] py-3.5 absolute top-[234px] left-[${button.left}] bg-[#485c10] rounded-[1000px]`}
          style={{ left: button.left }}
          aria-label={button.label}
        >
          <span className="relative w-fit mt-[-1.00px] font-link font-[number:var(--link-font-weight)] text-texton-accent-1 text-[length:var(--link-font-size)] text-center tracking-[var(--link-letter-spacing)] leading-[var(--link-line-height)] whitespace-nowrap [font-style:var(--link-font-style)]">
            {button.label}
          </span>

          <div className="flex w-[7px] items-center gap-2.5 relative self-stretch">
            <img
              className="relative w-1.5 h-[6.01px] aspect-[1]"
              alt=""
              src={button.image}
            />
          </div>
        </button>
      ))}

      {stats.map((stat, index) => (
        <div
          key={index}
          className="absolute top-[309px] h-[92px]"
          style={{
            left: stat.leftPosition,
            width:
              stat.value === "100"
                ? "139px"
                : stat.value === "0"
                  ? "105px"
                  : "112px",
          }}
        >
          <div
            className="left-0 absolute top-0 [font-family:'Poppins-Medium',Helvetica] font-medium text-slate-900 text-[64px] tracking-[0] leading-[normal] whitespace-nowrap"
            style={{
              width:
                stat.value === "100"
                  ? "106px"
                  : stat.value === "0"
                    ? "41px"
                    : "95px",
              left: stat.value === "0" ? "25px" : "0",
            }}
          >
            {stat.value}
          </div>

          {stat.suffix && (
            <div
              className="absolute top-8 [font-family:'Poppins-Medium',Helvetica] font-medium text-[#485c10] text-4xl tracking-[0] leading-[normal]"
              style={{
                left: stat.value === "100" ? "103px" : "76px",
                width: "30px",
              }}
            >
              {stat.suffix}
            </div>
          )}

          <div
            className="absolute [font-family:'Poppins-Medium',Helvetica] font-medium text-[#6f6f6f] text-xl tracking-[1.00px] leading-[normal] whitespace-nowrap"
            style={{
              top:
                stat.value === "100"
                  ? "69px"
                  : stat.value === "0"
                    ? "69px"
                    : "70px",
              left: stat.value === "100" ? "12px" : "0",
              width: stat.value === "0" ? "101px" : "91px",
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}

      <h2 className="absolute top-[517px] left-[110px] w-[115px] text-[#485c10] text-2xl [font-family:'Poppins-Medium',Helvetica] font-medium tracking-[0] leading-[normal] whitespace-nowrap">
        Recursos
      </h2>

      <p className="absolute top-[550px] left-[107px] w-[456px] [font-family:'Poppins-Medium',Helvetica] font-medium text-slate-900 text-[32px] tracking-[0] leading-[normal] whitespace-nowrap">
        O que a plataforma oferece
      </p>

      {features.map((feature, index) => (
        <article key={index}>
          <img
            className="absolute w-[300px] h-[250px]"
            style={{ top: feature.top, left: feature.left }}
            alt={feature.title}
            src={feature.image}
          />

          <div
            className="absolute w-[60px] h-[60px] bg-[#8e9c78] rounded-[30px]"
            style={{ top: feature.circleTop, left: feature.circleLeft }}
            aria-hidden="true"
          />

          <h3
            className="absolute [font-family:'Inter-Bold',Helvetica] font-bold text-white text-2xl text-center tracking-[0] leading-[21.6px] whitespace-nowrap"
            style={{ top: feature.titleTop, left: feature.titleLeft }}
          >
            {feature.title}
          </h3>

          <p
            className="absolute w-[204px] [font-family:'Inter-Bold',Helvetica] font-bold text-white text-base text-center tracking-[0] leading-[14.4px]"
            style={{ top: feature.descTop, left: feature.descLeft }}
          >
            {feature.description}
          </p>

          <div
            className="absolute w-[30px] h-[30px]"
            style={{
              top: feature.iconContainerTop,
              left: feature.iconContainerLeft,
            }}
            aria-hidden="true"
          >
            <img
              className="absolute"
              style={{
                width: feature.iconWidth,
                height: feature.iconHeight,
                top: feature.iconTop,
                left: feature.iconLeft,
              }}
              alt=""
              src={feature.icon}
            />
          </div>
        </article>
      ))}

      {bottomFeatures.map((feature, index) => (
        <article key={index}>
          <img
            className="absolute w-[300px] h-[250px]"
            style={{ top: feature.top, left: feature.left }}
            alt={feature.title}
            src={feature.image}
          />

          <div
            className="absolute w-[60px] h-[60px] bg-[#8e9c78] rounded-[30px]"
            style={{ top: feature.circleTop, left: feature.circleLeft }}
            aria-hidden="true"
          />

          <h3
            className="absolute [font-family:'Inter-Bold',Helvetica] font-bold text-white text-2xl text-center tracking-[0] leading-[21.6px] whitespace-nowrap"
            style={{ top: feature.titleTop, left: feature.titleLeft }}
          >
            {feature.title}
          </h3>

          <p
            className="absolute [font-family:'Inter-Bold',Helvetica] font-bold text-white text-base text-center tracking-[0] leading-[14.4px]"
            style={{
              top: feature.descTop,
              left: feature.descLeft,
              width: feature.title === "Open Source" ? "221px" : "204px",
            }}
          >
            {feature.description}
          </p>
        </article>
      ))}
    </section>
  );
};