class GpointConverter {
  static K0 = 0.9996;

  constructor(datumName = "ETRS89") {
    this.setEllipsoid(datumName);
    this.datum = datumName;
  }

  // Set ellipsoid parameters based on datum name
  setEllipsoid(name) {
    switch (name) {
      case "Airy":
        this.a = 6377563;
        this.eccSquared = 0.00667054;
        break;
      case "Australian National":
        this.a = 6378160;
        this.eccSquared = 0.006694542;
        break;
      case "Bessel 1841":
        this.a = 6377397;
        this.eccSquared = 0.006674372;
        break;
      case "Bessel 1841 Nambia":
        this.a = 6377484;
        this.eccSquared = 0.006674372;
        break;
      case "Clarke 1866":
        this.a = 6378206;
        this.eccSquared = 0.006768658;
        break;
      case "Clarke 1880":
        this.a = 6378249;
        this.eccSquared = 0.006803511;
        break;
      case "Everest":
        this.a = 6377276;
        this.eccSquared = 0.006637847;
        break;
      case "Fischer 1960 Mercury":
        this.a = 6378166;
        this.eccSquared = 0.006693422;
        break;
      case "Fischer 1968":
        this.a = 6378150;
        this.eccSquared = 0.006693422;
        break;
      case "GRS80":
        this.a = 6378137;
        this.eccSquared = 0.00669438;
        break;
      case "Hough":
        this.a = 6378270;
        this.eccSquared = 0.00672267;
        break;
      case "International":
        this.a = 6378388;
        this.eccSquared = 0.00669438;
        break;
      case "Krassovsky":
        this.a = 6378245;
        this.eccSquared = 0.006693422;
        break;
      case "Navstar":
        this.a = 6378137;
        this.eccSquared = 0.00669438;
        break;
      case "OSGB36":
        this.a = 6377560;
        this.eccSquared = 0.00667054;
        break;
      case "WGS84":
      default:
        this.a = 6378137;
        this.eccSquared = 0.00669438;
        break;
    }
  }

  // Convert latitude/longitude into UTM coordinates
  convertLatLngToUtm(latitude, longitude) {
    let LongTemp =
      longitude + 180 - Math.floor((longitude + 180) / 360) * 360 - 180; // -180.00 .. 179.9
    let LatRad = this.degToRad(latitude);
    let LongRad = this.degToRad(LongTemp);

    let ZoneNumber;
    if (LongTemp >= 8 && LongTemp <= 13 && latitude > 54.5 && latitude < 58) {
      ZoneNumber = 32;
    } else if (
      latitude >= 56.0 &&
      latitude < 64.0 &&
      LongTemp >= 3.0 &&
      LongTemp < 12.0
    ) {
      ZoneNumber = 32;
    } else {
      ZoneNumber = Math.floor((LongTemp + 180) / 6) + 1;
      if (latitude >= 72.0 && latitude < 84.0) {
        if (LongTemp >= 0.0 && LongTemp < 9.0) {
          ZoneNumber = 31;
        } else if (LongTemp >= 9.0 && LongTemp < 21.0) {
          ZoneNumber = 33;
        } else if (LongTemp >= 21.0 && LongTemp < 33.0) {
          ZoneNumber = 35;
        } else if (LongTemp >= 33.0 && LongTemp < 42.0) {
          ZoneNumber = 37;
        }
      }
    }

    let LongOrigin = (ZoneNumber - 1) * 6 - 180 + 3; // +3 puts origin in middle of zone
    let LongOriginRad = this.degToRad(LongOrigin);
    let zoneLetter = this.getUtmLetterDesignator(latitude);
    let UTMZone = `${zoneLetter}${ZoneNumber}`;

    let eccPrimeSquared = this.eccSquared / (1 - this.eccSquared);
    let N =
      this.a /
      Math.sqrt(1 - this.eccSquared * Math.sin(LatRad) * Math.sin(LatRad));
    let T = Math.tan(LatRad) * Math.tan(LatRad);
    let C = eccPrimeSquared * Math.cos(LatRad) * Math.cos(LatRad);
    let A = Math.cos(LatRad) * (LongRad - LongOriginRad);

    let M =
      this.a *
      ((1 -
        this.eccSquared / 4 -
        (3 * this.eccSquared * this.eccSquared) / 64 -
        (5 * this.eccSquared * this.eccSquared * this.eccSquared) / 256) *
        LatRad -
        ((3 * this.eccSquared) / 8 +
          (3 * this.eccSquared * this.eccSquared) / 32 +
          (45 * this.eccSquared * this.eccSquared * this.eccSquared) / 1024) *
          Math.sin(2 * LatRad) +
        ((15 * this.eccSquared * this.eccSquared) / 256 +
          (45 * this.eccSquared * this.eccSquared * this.eccSquared) / 1024) *
          Math.sin(4 * LatRad) -
        ((35 * this.eccSquared * this.eccSquared * this.eccSquared) / 3072) *
          Math.sin(6 * LatRad));

    let UTMEasting =
      GpointConverter.K0 *
        N *
        (A +
          ((1 - T + C) * A * A * A) / 6 +
          ((5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) *
            A *
            A *
            A *
            A *
            A) /
            120) +
      500000.0;

    let UTMNorthing =
      GpointConverter.K0 *
      (M +
        N *
          Math.tan(LatRad) *
          ((A * A) / 2 +
            ((5 - T + 9 * C + 4 * C * C) * A * A * A * A) / 24 +
            ((61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) *
              A *
              A *
              A *
              A *
              A *
              A) /
              720));

    if (latitude < 0) UTMNorthing += 10000000.0; // 10,000,000 meter offset for southern hemisphere

    return [UTMEasting, UTMNorthing, UTMZone];
  }

  // Convert UTM to Longitude/Latitude
  convertUtmToLatLng(UTMEasting, UTMNorthing, UTMZone) {
    let e1 =
      (1 - Math.sqrt(1 - this.eccSquared)) /
      (1 + Math.sqrt(1 - this.eccSquared));
    let x = UTMEasting - 500000.0; // remove 500,000 meter offset for longitude
    let y = UTMNorthing;

    let ZoneNumber, ZoneLetter;
    [ZoneNumber, ZoneLetter] = this.parseUtmZone(UTMZone);

    let NorthernHemisphere = ZoneLetter.charAt(0) <= "N" ? 1 : 0;
    if (NorthernHemisphere === 0) {
      y -= 10000000.0; // remove 10,000,000 meter offset used for southern hemisphere
    }

    let LongOrigin = (ZoneNumber - 1) * 6 - 180 + 3; // +3 puts origin in middle of zone

    let eccPrimeSquared = this.eccSquared / (1 - this.eccSquared);
    let M = y / GpointConverter.K0;
    let mu =
      M /
      (this.a *
        (1 -
          this.eccSquared / 4 -
          (3 * this.eccSquared * this.eccSquared) / 64 -
          (5 * this.eccSquared * this.eccSquared * this.eccSquared) / 256));

    let phi1Rad =
      mu +
      ((3 * e1) / 2 - (27 * e1 * e1 * e1) / 32) * Math.sin(2 * mu) +
      ((21 * e1 * e1) / 16 - (55 * e1 * e1 * e1 * e1) / 32) * Math.sin(4 * mu) +
      ((151 * e1 * e1 * e1) / 96) * Math.sin(6 * mu);
    let phi1 = this.radToDeg(phi1Rad);

    let N1 =
      this.a /
      Math.sqrt(1 - this.eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad));
    let T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
    let C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad);
    let R1 =
      (this.a * (1 - this.eccSquared)) /
      Math.pow(
        1 - this.eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad),
        1.5
      );
    let D = x / (N1 * GpointConverter.K0);

    let latitude =
      phi1Rad -
      ((N1 * Math.tan(phi1Rad)) / R1) *
        ((D * D) / 2 -
          ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) *
            D *
            D *
            D *
            D) /
            24 +
          ((61 +
            90 * T1 +
            298 * C1 +
            45 * T1 * T1 -
            252 * eccPrimeSquared -
            3 * C1 * C1) *
            D *
            D *
            D *
            D *
            D *
            D) /
            720);

    let longitude =
      (D -
        ((1 + 2 * T1 + C1) * D * D * D) / 6 +
        ((5 -
          2 * C1 +
          28 * T1 -
          3 * C1 * C1 +
          8 * eccPrimeSquared +
          24 * T1 * T1) *
          D *
          D *
          D *
          D *
          D) /
          120) /
      Math.cos(phi1Rad);

    longitude = LongOrigin + this.radToDeg(longitude);

    return [this.radToDeg(latitude), longitude];
  }

  // Helper methods
  degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  getUtmLetterDesignator(lat) {
    if (lat >= 84) return "X";
    else if (lat >= 72) return "W";
    else if (lat >= 64) return "V";
    else if (lat >= 56) return "U";
    else if (lat >= 48) return "T";
    else if (lat >= 40) return "S";
    else if (lat >= 32) return "R";
    else if (lat >= 24) return "Q";
    else if (lat >= 16) return "P";
    else if (lat >= 8) return "N";
    else if (lat >= 0) return "M";
    else if (lat >= -8) return "L";
    else if (lat >= -16) return "K";
    else if (lat >= -24) return "J";
    else if (lat >= -32) return "H";
    else if (lat >= -40) return "G";
    else if (lat >= -48) return "F";
    else if (lat >= -56) return "E";
    else if (lat >= -64) return "D";
    else if (lat >= -72) return "C";
    else return "B";
  }

  parseUtmZone(utmZone) {
    const zoneLetter = utmZone.charAt(0);
    const zoneNumber = parseInt(utmZone.slice(1));
    return [zoneNumber, zoneLetter];
  }
}

// Example usage
const converter = new GpointConverter();

// Convert latitude/longitude to UTM
const [easting, northing, utmZone] = converter.convertLatLngToUtm(
  51.5074,
  -0.1278
);
console.log(`Easting: ${easting}, Northing: ${northing}, Zone: ${utmZone}`);

// Convert UTM to latitude/longitude
const [latitude, longitude] = converter.convertUtmToLatLng(
  easting,
  northing,
  utmZone
);
console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
