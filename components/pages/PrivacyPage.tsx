import { getCv } from "@/lib/content";
import { getMessages, type Locale } from "@/lib/i18n";
import WaveformDivider from "@/components/WaveformDivider";

type Section = { title: string; body: string[] };

// Kept short and accurate to the Lead CRM requirements (RULE-G1..G7, RULE-E4,
// OUT-7, CAL-2). Update both languages together.
function sections(locale: Locale, email: string): Section[] {
  if (locale === "fr") {
    return [
      {
        title: "Responsable du traitement",
        body: [
          `Alexandre Hennequin, consultant indépendant en IA et Data Science, Marseille. Contact : ${email}.`,
          "Cette page explique quelles données je traite sur les professionnels que je contacte pour proposer mes services, et sur les visiteurs de ce site.",
        ],
      },
      {
        title: "Données et provenance",
        body: [
          "Pour la prospection, je tiens un CRM personnel. Pour chaque professionnel contacté, il contient : nom, fonction, entreprise, coordonnées professionnelles (adresse email professionnelle, profil LinkedIn), langue, les échanges avec moi (messages, réponses, notes et résumés d'appels) et les clics sur le lien personnel décrit plus bas.",
          "Ces données proviennent de LinkedIn (profils et publications publics, offres d'emploi), de ce site (prises de contact) et des rendez-vous réservés via Calendly. Le premier message que vous recevez indique d'où viennent vos coordonnées.",
        ],
      },
      {
        title: "Finalité et base légale",
        body: [
          "Prospection commerciale entre professionnels (B2B) pour mes missions freelance, fondée sur mon intérêt légitime (article 6.1.f du RGPD). Les messages portent sur votre activité professionnelle. Les données ne sont ni vendues ni cédées.",
        ],
      },
      {
        title: "Durée de conservation",
        body: [
          "Les données d'un contact sont supprimées 3 ans après le dernier échange. La suppression efface tout : fiche, échanges, résumés et données de suivi du lien.",
        ],
      },
      {
        title: "Opposition et désinscription",
        body: [
          "Chaque message offre une désinscription en un clic ; vous pouvez aussi simplement répondre « stop ». L'opposition est absolue, sans justification, et prise en compte avant tout nouvel envoi.",
          "Pour ne plus jamais vous recontacter, je conserve uniquement une empreinte chiffrée (hachage) de votre email ou de votre URL LinkedIn dans une liste d'exclusion, sans aucune autre donnée. Elle n'est jamais réintégrée automatiquement.",
        ],
      },
      {
        title: "Lien personnel",
        body: [
          "Mes messages contiennent un lien vers ce site avec un code court propre à chaque contact (par exemple /r/3f9a1c0b2e). Ce lien est personnel : le fait de le suivre est enregistré dans votre fiche, 3 ans au plus, et supprimé avec le reste de vos données.",
          "Seul ce clic est enregistré : aucun cookie n'est déposé et les pages consultées ensuite ne sont pas suivies.",
          "Aucun suivi d'ouverture : les emails sont en texte brut, sans pixel ni image de suivi.",
        ],
      },
      {
        title: "Appels",
        body: [
          "Un appel n'est enregistré ou transcrit qu'avec votre accord, demandé au début de l'appel. Sans accord, rien n'est enregistré. La prise de notes se fait localement sur mon ordinateur ; aucun robot ne rejoint l'appel.",
        ],
      },
      {
        title: "Hébergement",
        body: [
          "Ce site est hébergé par Vercel, qui fournit aussi des statistiques de fréquentation agrégées sans cookie. Les questions posées à l'assistant du site sont transmises à l'API Gemini de Google pour produire la réponse ; les conditions de Google lui permettent de les utiliser pour améliorer ses produits. Pour limiter les abus de l'assistant, l'adresse IP des visiteurs qui l'utilisent est conservée au plus un jour. Le CRM est une application privée, hébergée séparément de ce site chez un hébergeur cloud, accessible à moi seul.",
        ],
      },
      {
        title: "Vos droits",
        body: [
          `Vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition. Pour les exercer, écrivez à ${email} ; je réponds dans un délai d'un mois. Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr).`,
        ],
      },
    ];
  }

  return [
    {
      title: "Who processes your data",
      body: [
        `Alexandre Hennequin, independent AI & Data Science consultant (freelancer), Marseille, France. Contact: ${email}.`,
        "This page explains what data I process about the professionals I contact to offer my services, and about visitors to this site.",
      ],
    },
    {
      title: "What data, and where it comes from",
      body: [
        "For prospecting I keep a personal CRM. For each professional I contact, it holds: name, role, company, professional contact details (work email, LinkedIn profile), language, our exchanges (messages, replies, call notes and summaries) and clicks on the personal link described below.",
        "This comes from LinkedIn (public profiles and posts, job posts), from this site (people who get in touch) and from meetings booked through Calendly. The first message you receive says where your contact details came from.",
      ],
    },
    {
      title: "Purpose and legal basis",
      body: [
        "Business-to-business prospecting for my freelance services, based on my legitimate interest (GDPR Article 6(1)(f)). Messages relate to your professional role. The data is never sold or shared.",
      ],
    },
    {
      title: "Retention",
      body: [
        "A contact's data is deleted 3 years after our last exchange. Deletion removes everything: the record, exchanges, summaries and link-tracking data.",
      ],
    },
    {
      title: "Opting out",
      body: [
        "Every message offers a one-click opt-out, or you can simply reply “stop”. Opting out is absolute, needs no reason, and is honoured before any further message.",
        "So that I never contact you again, I keep only a hashed form of your email or LinkedIn URL on a suppression list, with no other data. It is never re-added automatically.",
      ],
    },
    {
      title: "Personal link",
      body: [
        "My messages include a link to this site with a short code unique to each contact (for example /r/3f9a1c0b2e). The link is personal: following it is recorded on your contact record for 3 years at most and deleted with the rest of your data.",
        "Only that click is recorded: no cookie is set and the pages viewed afterwards are not tracked.",
        "No open tracking: emails are plain text, with no tracking pixel or image.",
      ],
    },
    {
      title: "Calls",
      body: [
        "A call is recorded or transcribed only with your consent, asked at the start of the call. Without it, nothing is recorded. Notes are taken locally on my computer; no bot joins the call.",
      ],
    },
    {
      title: "Hosting",
      body: [
        "This site is hosted by Vercel, which also provides aggregate, cookie-free visit statistics. Questions asked to the site's assistant are sent to Google's Gemini API to generate the answer; Google's terms allow it to use them to improve its products. To limit abuse of the assistant, the IP address of visitors who use it is kept for up to one day. The CRM is a private application, hosted separately from this site with a cloud hosting provider and accessible to me only.",
      ],
    },
    {
      title: "Your rights",
      body: [
        `You have the right to access, rectify and erase your data, and to object to its processing. To exercise them, write to ${email}; I reply within one month. You can also lodge a complaint with the CNIL, the French data protection authority (cnil.fr).`,
      ],
    },
  ];
}

export default async function PrivacyPage({ locale }: { locale: Locale }) {
  const cv = await getCv(locale);
  const t = getMessages(locale);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
        {t.privacy.eyebrow}
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {t.privacy.title}
      </h1>
      <p className="mt-4 font-mono text-xs text-graphite">{t.privacy.updated}</p>
      <WaveformDivider className="mt-10 text-signal" />

      <div className="mt-12 max-w-2xl space-y-10">
        {sections(locale, cv.email).map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {section.title}
            </h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-graphite">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
