import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useGetCmsContent } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SiInstagram, SiTiktok } from "react-icons/si";
import { ShoppingBag } from "lucide-react";
import { useRef } from "react";

const iconMap: Record<string, React.ReactNode> = {
  SiInstagram: <SiInstagram className="text-4xl" />,
  SiVinted: <ShoppingBag className="text-4xl" />,
  SiTiktok: <SiTiktok className="text-4xl" />,
};

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: EASE },
  }),
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function Home() {
  const { data: cms, isLoading } = useGetCmsContent();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  if (isLoading || !cms) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section
          ref={heroRef}
          className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-muted/40 to-background -z-10" />
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="absolute inset-0 -z-10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          </motion.div>

          <div className="container mx-auto px-4 flex flex-col items-center text-center">
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-5xl md:text-7xl lg:text-[7rem] font-serif max-w-6xl tracking-tight leading-[1.05]"
            >
              {cms.heroHeadline}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-8 text-xl md:text-2xl text-muted-foreground max-w-2xl font-light"
            >
              {cms.heroSubheadline}
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-12 flex flex-col sm:flex-row gap-4"
            >
              <Link href="/store">
                <div className="flex justify-center mb-8">
                  <Button size="lg" className="h-14 px-10 text-base rounded-xl">
                    Esplora la Collezione
                  </Button>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* CHI SIAMO */}
        <section className="py-28 md:py-40 bg-card border-y border-border relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 0.04, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          >
            <span className="font-serif text-[20vw] leading-none font-black text-primary">
              MAN
            </span>
          </motion.div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-6xl mx-auto">
              {/* Foto */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
                >

                <div className="aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
                
                <motion.img
                  src="/img.png"
                  alt="Lucchini Luca — Founder"
                  className="w-full h-full object-cover object-center"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.6 }}
                  style={{ willChange: "transform" }} // <-- Aggiungi questo
                />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="absolute -bottom-6 -right-6 bg-background border border-border rounded-2xl p-5 shadow-xl"
                >
                  <p className="font-serif text-lg">{cms.founderName}</p>
                  <p className="text-xs tracking-widest uppercase text-muted-foreground mt-1">
                    Founder & Curator
                  </p>
                </motion.div>
              </motion.div>

              {/* Testo */}
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-8"
              >
                <motion.h2
                  variants={fadeUp}
                  className="text-4xl md:text-5xl font-serif leading-tight"
                >
                  {cms.chiSiamoTitle}
                </motion.h2>
                <motion.div
                  variants={fadeUp}
                  className="text-muted-foreground font-light leading-relaxed text-lg space-y-4"
                  dangerouslySetInnerHTML={{
                    __html: cms.chiSiamoBody.replace(/\n/g, "<br/>"),
                  }}
                />
                <motion.div variants={fadeUp}>
                  <Link href="/store" className="no-underline">
                    <Button variant="outline" size="lg" className="rounded-xl">
                      Scopri la Collezione →
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SOCIAL DIRECTORY */}
        <section className="py-28 md:py-36 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-serif">Seguici</h2>
              <p className="text-muted-foreground mt-4 font-light">
                Rimani aggiornato su nuovi arrivi ed esclusive.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto"
            >
              {cms.socialLinks.map((social, i) => (
                <motion.a
                  key={i}
                  variants={fadeUp}
                  custom={i}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all group cursor-pointer"
                >
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    {iconMap[social.icon] ?? (
                      <ShoppingBag className="text-4xl" />
                    )}
                  </span>
                  <span className="mt-6 font-medium text-sm tracking-widest uppercase">
                    {social.label}
                  </span>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA VENDI */}
        <section className="py-24 bg-primary text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="container mx-auto px-4 text-center"
          >
            <h2 className="text-3xl md:text-5xl font-serif mb-6">
              Hai un articolo da vendere?
            </h2>
            <p className="text-primary-foreground/80 text-xl font-light mb-10 max-w-xl mx-auto">
              Ci pensiamo noi. Proponi il tuo articolo e ricevi il pagamento non
              appena sarà venduto.
            </p>
            <Link href="/proponi">
              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-12 text-base rounded-xl"
              >
                Vendi anche tu il tuo articolo →
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
