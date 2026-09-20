export type OfficialChannel = {
  id: string;
  country: string;
  name: string;
  nameHi?: string;
  url?: string;
  phone?: string;
  verified: boolean;
  note?: string;
};

export const CHANNELS: OfficialChannel[] = [
  {
    id: "in-cybercrime-portal",
    country: "IN",
    name: "National Cyber Crime Reporting Portal",
    nameHi: "राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल",
    url: "https://cybercrime.gov.in",
    verified: true,
  },
  {
    id: "in-1930",
    country: "IN",
    name: "National cyber fraud helpline",
    nameHi: "राष्ट्रीय साइबर धोखाधड़ी हेल्पलाइन",
    phone: "1930",
    verified: true,
  },
  {
    id: "in-sanchar-saathi",
    country: "IN",
    name: "Sanchar Saathi (Chakshu) for suspected fraud calls/SMS",
    nameHi: "संचार साथी (चक्षु)",
    url: "https://sancharsaathi.gov.in",
    verified: true,
  },
  {
    id: "in-bank-fraud-line",
    country: "IN",
    name: "Your bank's official 24x7 fraud line (number on your card or official app)",
    nameHi: "आपके बैंक की आधिकारिक 24x7 धोखाधड़ी हेल्पलाइन (कार्ड या आधिकारिक ऐप पर)",
    verified: true,
  },
  {
    id: "us-ftc",
    country: "US",
    name: "FTC ReportFraud",
    url: "https://reportfraud.ftc.gov",
    verified: true,
  },
  {
    id: "us-ic3",
    country: "US",
    name: "FBI IC3",
    url: "https://www.ic3.gov",
    verified: true,
  },
  {
    id: "us-7726",
    country: "US",
    name: "Forward spam texts to 7726",
    phone: "7726",
    verified: true,
  },
  {
    id: "uk-placeholder",
    country: "UK",
    name: "UK official reporting channels",
    verified: false,
    note: "Confirm the current official website before contacting anyone.",
  },
];

export function channelsForCountry(country: string): OfficialChannel[] {
  const code = country.toUpperCase();
  const match = CHANNELS.filter((channel) => channel.country === code);
  if (match.length) return match;
  return CHANNELS.filter((channel) => channel.country === "IN");
}

export function channelsXml(country: string): string {
  const list = channelsForCountry(country);
  return list
    .map((channel) => {
      const parts = [
        `id=${channel.id}`,
        `name=${channel.name}`,
        channel.url ? `url=${channel.url}` : null,
        channel.phone ? `phone=${channel.phone}` : null,
        `verified=${channel.verified ? "true" : "false"}`,
        channel.note ? `note=${channel.note}` : null,
      ].filter(Boolean);
      return `<channel ${parts.join(" ")} />`;
    })
    .join("\n");
}
