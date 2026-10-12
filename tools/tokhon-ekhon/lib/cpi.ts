/*
 * Bangladesh consumer price index, annual average (2010 = 100). One series, nothing typed by hand:
 * generated from the World Bank API response, values rounded to 4 decimals.
 *   Indicator: World Development Indicators FP.CPI.TOTL "Consumer price index (2010 = 100)", Bangladesh (BGD).
 *   API: https://api.worldbank.org/v2/country/BGD/indicator/FP.CPI.TOTL?format=json&per_page=100
 *   Page: https://data.worldbank.org/indicator/FP.CPI.TOTL?locations=BD
 *   The World Bank takes it from the IMF's International Financial Statistics, which carries the national CPI
 *   compiled by the Bangladesh Bureau of Statistics (BBS).
 *   World Bank "lastupdated": 2026-10-08. Fetched and checked: 2026-10-11.
 * Update once a year: refetch the API, regenerate this table, bump CHECKED/WB_UPDATED, run the tests.
 */
export const CPI: Readonly<Record<number, number>> = {
  1986: 24.28,
  1987: 26.6776,
  1988: 28.6551,
  1989: 30.3875,
  1990: 32.2492,
  1991: 34.2994,
  1992: 35.5459,
  1993: 36.6175,
  1994: 38.5633,
  1995: 42.5345,
  1996: 43.5456,
  1997: 45.8559,
  1998: 49.7088,
  1999: 52.7444,
  2000: 53.9091,
  2001: 54.9912,
  2002: 56.8238,
  2003: 60.045,
  2004: 64.6009,
  2005: 69.1531,
  2006: 73.8315,
  2007: 80.5553,
  2008: 87.7263,
  2009: 92.4841,
  2010: 100,
  2011: 111.3952,
  2012: 118.3212,
  2013: 127.2312,
  2014: 136.1268,
  2015: 144.5589,
  2016: 152.5291,
  2017: 161.2265,
  2018: 170.1642,
  2019: 179.6798,
  2020: 189.9055,
  2021: 200.437,
  2022: 215.8646,
  2023: 237.1996,
  2024: 262.0243,
  2025: 285.0006,
};

export const SOURCE_URL = "https://data.worldbank.org/indicator/FP.CPI.TOTL?locations=BD";
/** The World Bank's own "lastupdated" for this series (2026-10-08). */
export const WB_UPDATED = "৮ অক্টোবর ২০২৬";
/** Shown as "যাচাই করা: …" next to every result. */
export const CHECKED = "১২ অক্টোবর ২০২৬";
// ISO twin of the date above for schema dateModified and sitemap lastmod; bump both together.
export const CHECKED_ON = "2026-10-12";

/*
 * "Now" is the current year, which has no annual average yet. Its price level is the latest annual average
 * carried forward by BBS's latest point-to-point inflation (September 2026: 8.34%, released 7 October 2026).
 * Update monthly or yearly: change the rate, month and link; once the World Bank publishes the 2026 average,
 * add it to CPI above and move NOW_YEAR on.
 */
export const NOW_YEAR = 2026;
export const NOW_INFLATION = 8.34;
export const NOW_AS_OF = "সেপ্টেম্বর ২০২৬";
export const NOW_SOURCE_URL = "https://www.bssnews.net/business/432352";
