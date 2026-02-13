import vector from "./vector.svg";

export const CallToActionSection = () => {
  return (
    <section className="absolute top-[201px] left-[349px] w-[602px] h-[280px] flex flex-col">
      <div className="ml-[198px] w-[182px] h-[30px] relative">
        <div className="absolute top-0 left-0 w-[180px] h-[30px] bg-[#e4e4e4] rounded-[99px]" />

        <span className="absolute top-1.5 left-[53px] w-[97px] [font-family:'Poppins-Medium',Helvetica] font-medium text-[#485c10] text-sm tracking-[0] leading-[normal]">
          100% Gratuito
        </span>

        <div
          className="absolute top-[3px] left-[19px] w-6 h-6"
          aria-hidden="true"
        >
          <img
            className="absolute w-[83.34%] h-[79.47%] top-[8.33%] left-[8.33%]"
            alt="Ícone de verificação"
            src={vector}
          />
        </div>
      </div>

      <h1 className="ml-[3px] w-[593px] h-[83px] mt-3 [font-family:'Poppins-Medium',Helvetica] font-medium text-slate-900 text-[64px] tracking-[0] leading-[normal]">
        Organize sua vida em
      </h1>

      <h2 className="ml-[132px] w-[411px] h-[70px] mt-3.5 [font-family:'Poppins-Medium',Helvetica] font-medium text-[#485c10] text-[64px] tracking-[0] leading-[normal] whitespace-nowrap">
        um só lugar.
      </h2>

      <p className="w-[582px] h-9 mt-[35px] [font-family:'Poppins-Medium',Helvetica] font-medium text-[#6f6f6f] text-2xl tracking-[0] leading-[normal]">
        Menos bagunça mental. Mais execução diária.
      </p>
    </section>
  );
};