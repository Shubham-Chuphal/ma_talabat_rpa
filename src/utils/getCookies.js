// Utility to fetch Talabat token info from DB, parse, and transform to array-of-objects format
// Usage: await fetchTalabatTokenArray({ clientId, platformId, commonDB })
const axios = require("axios");
const { getTokenByClientAndPlatform } = require("../services/dbOperation");

/**
 * Fetch Talabat token info from DB, parse, and transform to array-of-objects [{store: cookieString}, ...]
 * @param {object} params
 * @param {string|number} params.clientId
 * @param {string|number} params.platformId
 * @param {object} params.commonDB - DB connection (i.e., db.common)
 * @returns {Promise<Array<object>>}
 */
async function fetchTalabatTokenArray({ clientId, platformId, commonDB }) {
  const tokenInfo = await getTokenByClientAndPlatform(
    clientId,
    platformId,
    commonDB
  );
  if (!tokenInfo?.token_data)
    throw new Error("Token info not found for client/platform");
  let tokenInfoRaw = tokenInfo.token_data;
  let tokenInfoObj;
  if (typeof tokenInfoRaw === "string") {
    try {
      tokenInfoObj = JSON.parse(tokenInfoRaw);
    } catch (e) {
      throw new Error("Failed to parse token_data from DB: " + e.message);
    }
  } else {
    tokenInfoObj = tokenInfoRaw;
  }
  // Transform to array-of-objects [{store: cookieString}, ...]
  let tokenInfoArray = [];
  if (Array.isArray(tokenInfoObj)) {
    tokenInfoArray = tokenInfoObj;
  } else if (tokenInfoObj && typeof tokenInfoObj === "object") {
    tokenInfoArray = Object.entries(tokenInfoObj).map(
      ([store, cookieString]) => ({ [store]: cookieString })
    );
  } else {
    throw new Error("token_data from DB is not in expected format");
  }
  return tokenInfoArray;
}

/**
 * Fetch fresh Talabat cookies from the AWS Lambda endpoint for a given clientId.
 * @param {string|number} client_id - The client ID to send in the POST body
 * @returns {Promise<Array<{[store: string]: string}>>} Array of cookie objects
 */
async function fetchTalabatCookies(client_id) {
  const url =
    "https://w4bdz7utvwumopkmnpslzwx4za0aseqk.lambda-url.ap-south-1.on.aws/";
  try {
    // const resp = await axios.post(url, { client_id });
    let resp = {
      data: {
        247687:
          "_nprtnetid=nav1.public.eyJ0aWQiOiJkYjBjYzNiMC0zY2UzLTQwMDQtYjE0Zi0xNTRjYzQ5NDMwZjUiLCJzaWQiOiI1Mzg0MjQ0ZC0xYzllLTQzOWQtYTRhZS0xMTY3ZjU1NTExYjgiLCJleHAiOjE3NTQ2Nzg0NTl9VEp2ZDVTaEkvZ2tlTThwSkNpclh3NzFaSHI5dGQ0bFVTbXZPdVMrMDFvSlp3SjJxcE9OaUVFYWg2b0lqZUVzaUtodUhZR3pwQmpPN0k5dy8vNldxb2IxY0FDdlN0NXNSRzhobVEvRFMwd1NTdW1YK3g1YkFEMThJdUJzVnhyTUNGYWhjRVFpZStSNUo1Z2RickhsK3R4Rm5aWHdaWUQ3OG5HK0Jpck92NmpXbWlxVFIvemlVU0MrRkJlZWFYcmRUOW1CWks4bVR3dExER1pHWlNWcHBPcnFaVUxvd1RsNzdZK1lpUWh2Z2tmYlhaQzVCbmZENXB4bzRIM2U1UTJhVU9aM0V2U0JYNTA3Nkh1d2RIdTZqMTlZUjFGMTV1SExFK0JEUVljeHk1U0NDZEs1NmxGOTM0bXdwa0RQVkN2cEF3aDg0dVdpRm1uTUxuT1BxT1ViOG1Sc3E3ZzB1SDI1WlVnU0xYQ01jK1M4SDJWejRPdEVaWmNITHgxeStwVDFLL1Q2OE0yYkMzaWEyL2ZiZHN0eFcrczVKZy9qSmRDbjgwRVZPOU1ZY3plSXlSRHErb0JMUXRTUjdEZjhaU2ZUWG5MSkJUOE5UU0NneFhFQ1d3ZHh0OUdSOVlrU3hqZ2pRVjRMbWZtbU4rOTR0ZjhLN05XYU41a3hqaTh0bmZFemU=.MQ==; _npsid=5384244d-1c9e-439d-a4ae-1167f55511b8;",
      },
    };
    // let resp = {
    //   data: {
    //     "durex.os":
    //       "SPC_T_ID=VZZsyA2qWGz3T7xaCae91j19UvhJgTW8OmjNb1hjw7LhnxVlAseOvUotFjDu1zfj/Uz11WvxRsAzRDxlv7c1m4mN5ERXOPZpUGPfnImoS5WiwrEd5TgK6tDyTAlOaTsGQSrazP+6clh2nAa8xZQFSA88oW3pHh9VFyCZVsnul74=; SPC_T_IV=YTQ5Nk03TTJVUWhuQlVUdw==; SPC_SI=+zt3aAAAAABCWVBrcGR5MoWyPAAAAAAAeWJwanJxcUE=; SPC_F=sCHjdDKsEVpfLrs6SHnND6YEKRbS0D1p; REC_T_ID=adf9aede-6492-11f0-8896-6e9fbd13228f; SPC_R_T_ID=VZZsyA2qWGz3T7xaCae91j19UvhJgTW8OmjNb1hjw7LhnxVlAseOvUotFjDu1zfj/Uz11WvxRsAzRDxlv7c1m4mN5ERXOPZpUGPfnImoS5WiwrEd5TgK6tDyTAlOaTsGQSrazP+6clh2nAa8xZQFSA88oW3pHh9VFyCZVsnul74=; SPC_R_T_IV=YTQ5Nk03TTJVUWhuQlVUdw==; _gcl_au=1.1.348236145.1752924160; _fbp=fb.2.1752924160275.973485028964515353; AMP_TOKEN=%24NOT_FOUND; _gid=GA1.3.1825631700.1752924161; _dc_gtm_UA-61915055-6=1; _ga=GA1.1.727249369.1752924161; language=en; SPC_SI=+zt3aAAAAABCWVBrcGR5MoWyPAAAAAAAeWJwanJxcUE=; SPC_SEC_SI=v1-dzFRRlU2MkJLa2hIeWVicvcEc7iJnuys24e4oTPx505/qxHqm3iJXYvHER75X3TBpFtHJAIavFrWpHVIE+VhZsLtGQQkxxqz4stdfD3wcXc=; _ga_NEYMG30JL4=GS2.1.s1752924160$o1$g0$t1752924164$j56$l0$h0; SC_DFP=RGJoJShWXoczPYuVVWRubHAIpLVCWXaC; SPC_CDS=8f70f7ce-1c9c-4253-a000-331205217ead; SPC_SC_SESSION=gCem/b1ezja8anJfdhzaVdN9AoZLj9yuXXx5Rn+Alpk1Dg/Dd/spCV4/72akR6jBMxEVhx1efX3UghDW/hfV8Oup/eJ3rKb2lxNJL9E8hOqudphzSiFYRlSOLcX1xMi5Ql5SH2+9AtCCJ8nnlEdG7S3sL0vI3EtWqJTySg/EAk7YtHpQI0dzq1My7/xq1kJ/vfBunIGzmorlNzgcJUkVkmjhUlS558H9rmQYA8CATEVuJm9/GQcE9r6DGsjb2cU+eGy5EqxhonSnO1JN/XCIUgja6/xaeDQ/iw+ahclyKqjap8PXVB6hbMIXVhgYhUVlK3DAyOGN+RAdPWWYWc0MJTE1gu0FebZIsSu+rhrXlbqWlMsctU+OYE4hrrpaDDr47xbZM4+qYZoZUAikU1WrNJC+KSqvAU2lDuRRY3L/E3Lk=_2_3714520; SC_SSO=SnVJczl6Uml0cFlsNjhnWugGYcHso06npwxL9qPFPypBBArnTwOYUpm/6K733uWq; SC_SSO_U=3714520; SPC_STK=8zerkb9o80pehY/Z91cIuGzPXRchQSywee3pumTiyr6+YW53pZG/s2FVz4K6OMqccCCTtqzCV1j36hVTBcK50foUK8+KfwPOLWyIe/OZKQDDuS3eN7YVqlxeoHumfpycjMnGAkHx/KeMXP4xIPd98SEKhuD/Z3VkUm1SjPT6zbxsxtJVHFbk6lIQ9NN2DEUGhd9DMmXc7EXStI/ZOV1h6qsWRCbyR6OpD8gxrkHJ3F02NwOVjhX30u2IDVQEgknyRDqs3QLQtiznVkScod/fwXTZkpX7aypksAPWbjpu4CkjnBtfV+krXWZh9oua7v1K3HYlghEDXt4t/4WPW5FBsdfWa1qtSm9zcu60Z4K20v0KuxYq94vKRWhs5R6c2S0zppotrnPwg3QsQsk9KZkIwR3CS8+DU4/xuywnoQxaQ7bl5WEXoXOpruRfvv7xecN/IEOj3v3iiC2CzZ3H2v1K3PWQoWi6lmzuQe02SHG7TQhYA6GaUyUCPVbBtm+q/dOtU+wlmwNGxZdv6xhngK1aDL+F0H3gGWca2pYA++6WJOBEQuA09tr+Nz96xXZKKfXmYtYvhUO69fejVhvN1SuhDfZGRP+hAYbsvLM0Pd3oN3hSOhA3Mc0WdGZKxveO/m00RxBxeVjOXl7L76yICckDdMPdBIk/bEkSEKEE3oT6JAoWh9g3+E+4XXruzhp0BfsueC1mjCT+3c/a3yz76oEegg==; SPC_SC_OFFLINE_TOKEN=eyJkYXRhIjoiWkIxYVhWTHBiZTVhN0U0MmRwZEk3VXY2V1hLMXVNUDl1dTc0RGZkQnV3eVpKdjRjNHlDVVlpcm9aeXVEcVBiMGFHeCtlV3JlY0JSS0JXWDF5NzFmT0RzMEdOWFBhSzMzRytuS1BMRU1qYmFJaXAyVWlkVXBsay85WWhWdnNvNWtnMFUyY2xrZXRaUzJicDR6ZGRsS2ptYXF6K0J6dUhaRXVNK0xLTXF1T0V4SHRxRjN2Z0MyK0Y4QlFxZG5PUWNJcTNSNkNPaEpzdU1HdmhFZlc3WExPZz09IiwiaXYiOiIrVmlJOFdydWI1K0JkNDFwWXlQemFRPT0iLCJzaWduIjoiZmZuS2VLK1dOSVJmR0ZMUGN2MGxxK0JJQnZPSHkvazFIbm5XNFJ0UjliaGE2RHcvVWxGd2UxeFNBUW1NOXloa3JWdDg5Y0NFUmZTSEs1SUVDMkUzRFE9PSJ9; CTOKEN=u%2FNjkGSSEfCYK0Y%2B9al7EA%3D%3D; _QPWSDCXHZQA=b459446f-23aa-49c4-a3ce-915cdf215a87; REC7iLP4Q=4c31a861-3510-4ae8-84ad-9c91b27ae891; _sapid=e884fc8df20487e5edd9308f189a273e7157bcde6658a3b27f2fefd4; SPC_CDS_CHAT=b5a87fa3-2cc7-4596-b847-87c191d0ade3; shopee_webUnique_ccd=6fKXoLfMyZrlMNEiEQLypg%3D%3D%7CV3Z0Lx0XazFhQyX8w383nH5dnmzXgxvl3QT6uiRy7HuXf%2B1ICBKOO%2FrGp9b51oHYRy8M9dwTa0sUNw%3D%3D%7Ccu7FM1YtTm7Gu4hj%7C08%7C3; ds=bf0e13cda29710e30f322e15b5c0196a",
    //     "dettol.os":
    //       "_gcl_au=1.1.2003966900.1752924388; SPC_F=5WTfjFZdR443VxcjolvSAbt3VgChVo7j; REC_T_ID=363f8343-6493-11f0-9ff3-2241857c41d6; SPC_R_T_ID=NTR+JtG5LCqAmWTnlk7XiVz/i75TH4Okm08W93+IF/7aapCngysTXfA2HOd4mQvn9xeo9FczoaLA/N8L7qOV5Kg2aAgp2oTGVLS6L0Ep28fol71NIRiQlVLwYHbzmacBAjJIwqFqouHGhQb5qhvsxkahvuTAwpdbzFybu8zk3Ts=; SPC_R_T_IV=OEtkRFg4RjBaV0NPM09uOA==; SPC_T_ID=NTR+JtG5LCqAmWTnlk7XiVz/i75TH4Okm08W93+IF/7aapCngysTXfA2HOd4mQvn9xeo9FczoaLA/N8L7qOV5Kg2aAgp2oTGVLS6L0Ep28fol71NIRiQlVLwYHbzmacBAjJIwqFqouHGhQb5qhvsxkahvuTAwpdbzFybu8zk3Ts=; SPC_T_IV=OEtkRFg4RjBaV0NPM09uOA==; SPC_SI=OkB3aAAAAABDTERmbDJFRhISqgAAAAAAbUVDSnl1aWo=; _fbp=fb.2.1752924388371.47242239399777966; AMP_TOKEN=%24NOT_FOUND; _ga=GA1.3.1471819302.1752924390; _gid=GA1.3.1066861853.1752924390; language=en; SPC_SEC_SI=v1-WGw5YWhPSEJPV0RMcTJBTUyWsf7T+O/t2+60T+0pFBgLDOaWR7B7ed4Fwel5/1GL/M7IKEGv+eRjtHTsBYIsuV8an/Pqn3JWmc5jq4KpxHU=; SPC_SI=OkB3aAAAAABDTERmbDJFRhISqgAAAAAAbUVDSnl1aWo=; _ga_NEYMG30JL4=GS2.1.s1752924389$o1$g0$t1752924397$j52$l0$h0; SC_DFP=XPBkcIEwvqyMIVJcxlTKULOAMLxDirWN; SPC_CDS=5174e485-9455-4927-8f59-c42ca005d63b; SC_SSO_U=3714520; _QPWSDCXHZQA=d0fa1104-c9bf-4ea8-eb0b-f848ddf9d230; REC7iLP4Q=8d494323-c8e4-4e6b-a8c3-a78050f9faef; _sapid=fa0cffbeea8d84d6ff5133bc354ebe66e449be99697bd071ad48ddca; SPC_CDS_CHAT=21138a97-71ac-4dce-b08a-1dfb0bd14dab; SPC_SC_SESSION=g2UPQ0ahfKoQizvqZ/pXokU68V68ECHqeZ3edC+3gZewSJgBWefgjITEuxYiZ5ENv6brW4KrakDV8jVG3eN//hW5GZ3lXAu8XkrqUddsilVACNE69PnyZZ65lGfLdYHwyGxlZ5BAgAQoCnPmgZ4tB698Fy6sxEissnkc7a3/kb0mms7KvbEzG79p/fIZcLzz8NrQXSQbhCZM2Bi9kNIBPxaeQr5dihGcbtx7j5HQp6+imOiIRqQiic/T9zP2M9kvRms06YB4SxfxMUlSU2T1LfKFxwQaO2dob69LtHebCBwTQ/XrQbO3D8ttreLLClxFgcEGs1MbIH9gPjPH1SwH5r4EhwzjyBU1uk7CfVPd8ZDHYNHucwqhVPipfFrnGgRowQXuNtM2wZ1nCjf+LaruU+YsGW0igUT+LmPs3FmdsmLo=_2_3714520; SC_SSO=QVpSdGtjZjdoUW9kZWw1SDvVNbNnoN1uI6b5Nl9X0epRr8UjgR5T2zltwFuV7SSO; SPC_STK=n8kz77/vGB6DDMmzjGtb+aRxbFpiGHVHmW+eiSMXNVfROi16Ph9ZjZGUbq/5pkj7ulX2O9Kl/9NdYZ9LkWi6jr6yO3c6SsgUrk0mRM9OLDzu61oMsedR/ff0s9wptmSbQZMcyAESZk/lpELYDTrhn/i9CLtk8YSL6HRoWojmzbi1ZXvnHhnaFijY2QiTpvN0GROycNndB0TdIRv87jzZpOqOrkLwyM0P4Hj4Cb0sTtWwxefkL9ZMXEYfgJ9QdyPXVJ2bsYfQ7wXmJmrlQSJoWQzqulwGY00Ttch6bb3zHnmIlyXNSz9GX1l+xk3VuYmnuwDtKuYhG1/YxNTFn3CgPI8ECjESCJfyzcQNvZFoa/6h1XFzSHHQFc3Mpvq8E0BHs7gFCaDN8SxZkNhicRi6fEtoCbUaYaDtOsQI7TWZ3C5D80OSRWAApmkSMfE4I11VJLBWNrduLRnhZ0Q9y87E6BY/beENzmMsX7E9JkvELHPlZJmpHp8WKUd2huzRqOy7/2HCC8g93LGt2JzZDYwb6DLEGB4gtkjjpTQRlM16IasAOVLkkXZdl8a5wWAub8J+h2HSXJ91el42cXYWIfyWKfrobzDKfF+D212XPLAegs9V8k6mmRGdvfoovbqk+0Hh4r7G/cRw4H2FNvqF/QCzncAIiBKuBroXd5VduuJIaXUv+5/uJB/0ktw7dBKCcbzj; SPC_SC_OFFLINE_TOKEN=eyJkYXRhIjoiNXR1VGk0cDhnYXBPZkZhYmlTSGMwWEZ4TUFCQVdTOCtBeWVZb3pWdUFMYVV2SjlqNWVvdzJKaWdtWjB6dzlkUjBETmVkaWd6SVdSYndKQXdWM3BVWmlnaUdiS3YySWMxaTVoV2RKMFdOWEhRaGdLZGloK1RQOUdOcW5IRVBNcStFZDdtMHh1SGw4czh2STczTnFqNXRzVmJsaHQzaURvd1hHcUtDREtaNzJMQlFWTHEwZjZyU3ZpQ2ZNTzRDOWdDb3VZOGRTN21adUdnTkdraTNuNHFHQT09IiwiaXYiOiJJR1JVVjVoWFR5MmY5MUtKdlVKSVZBPT0iLCJzaWduIjoiQnJMUWVWdnYvdkFFVnNOZERsY0RPL3ZvN1VkRlpacUFkalN2WWZUc0V5QWloalRPSU1hMkNXR2tUK0tzT01jVkxLdld6N1JpMURMYXR4bTI0d1BWREE9PSJ9; CTOKEN=V%2BKeSmSTEfCQ9GrcO8SsrQ%3D%3D; shopee_webUnique_ccd=C2suR24STk5dqYD3mTVKiA%3D%3D%7CiGcTxTHVfdtEqK7tff%2B7Zl0uUlAxy46r0N53SAR0By2iGD0OYlMnUJfHqStsFfnoxHzN1EbryqtWOA%3D%3D%7C0HLEMHhdgqIfVVNv%7C08%7C3; ds=25f796304f85c35c1f3203d0cd2e918c",
    //     "sustagen.os":
    //       "_gcl_au=1.1.1857718702.1752924509; SPC_T_ID=QAGXVGCqGo6FsaDI/bjP7jRD8PSFraMHwx4+Cga0nGT70LV1Z+3k48evOx9XV0tO65SYSrmLlP7BCi+MENx3k3gB8LeoyGBmmd+4bY8FGFxUfA//j7wgL+vrhV+ekW45EzFEbUeNslVn/J25CnsuzQiQ90BKsM21n7k4GAkSAEY=; SPC_T_IV=Sk1VNm1Qd1ZGU21UNHJOMA==; SPC_SI=P0B3aAAAAABBbXJKYVhOS3UZqgAAAAAAQXRiaEdzdTQ=; SPC_F=kia9ezlV7IxNZZV5wc26pKobwGYcHexW; REC_T_ID=7e77bd6a-6493-11f0-9251-b2f7f8271f9d; SPC_R_T_ID=QAGXVGCqGo6FsaDI/bjP7jRD8PSFraMHwx4+Cga0nGT70LV1Z+3k48evOx9XV0tO65SYSrmLlP7BCi+MENx3k3gB8LeoyGBmmd+4bY8FGFxUfA//j7wgL+vrhV+ekW45EzFEbUeNslVn/J25CnsuzQiQ90BKsM21n7k4GAkSAEY=; SPC_R_T_IV=Sk1VNm1Qd1ZGU21UNHJOMA==; _fbp=fb.2.1752924509638.883333372379679619; AMP_TOKEN=%24NOT_FOUND; _ga=GA1.3.1204288028.1752924510; _gid=GA1.3.1831346563.1752924511; language=en; SPC_SI=P0B3aAAAAABBbXJKYVhOS3UZqgAAAAAAQXRiaEdzdTQ=; SPC_SEC_SI=v1-UVhQNnh5bTR5NFp5eUFpRr5P3F+uwldeu3pfr2MFGtrlIzLutyexcW+KihHDXnuHILwS6u8upLBZhQq4XQqKHLPyln1cqfgT6lpDtYO6yN4=; _ga_NEYMG30JL4=GS2.1.s1752924510$o1$g0$t1752924519$j51$l0$h0; SC_DFP=wYocjAutgkJkKNcMuwoIQiAuWjknUZOI; SPC_CDS=c55b515a-ac07-4436-8e3f-19e7db5c7324; SC_SSO_U=3714520; _QPWSDCXHZQA=a93532ac-b669-46b7-c96a-1cc413f0844d; REC7iLP4Q=87792edb-671a-484a-8015-ac409860302c; _sapid=a35d3c5ddcdc4735a600f05fc9a42e10ac36788411c67987c7da1729; SPC_CDS_CHAT=388d69a2-c9aa-4e92-afcb-ddd3b9b89afe; SPC_SC_SESSION=gne5BTjUyOhbjdv83++84I90tiW5hvjcEt5yJuWSjgRLDokl4U668FJQy8BzDmMceXVYufGuR8adjQJiWwipU5M0PNF2fh9hFE1WOoPmVE6m4ho7Ou1XCD5umfPluTGHoL/INvbRIOQfb0C2OkWTdAiDkUGpXB3fxDS3TW61Ze0WrNLE0Z7YdTDvsquQxtKY0U595m/Sy3cO8jG++elBiqg3sm0t4zSKjJ292THQUKNFgpfCdSqnQdQMX4BY0ula4cpLvv8JEK8g1mPCUbnA7PeC6uonn42oMvEaxnxbKfTkmO0WLtjN29ogfBGOInUfxD7YiYOGYwz4D1pI1n+FcNMQlzaTB1I/rig9bAFe5zprz76tj2uw4BQBA8cxwqACNInqvnm6dS+84MdM1YGbsHfC/APE/IA3t3FKXSol6bdM=_2_3714520; SC_SSO=WWNSZDIxVlBsRlEzR2hRU1g3wK8fcb9quk3ztNjnzN6ZIgfsXFHlFN3k6nBPe27q; SPC_STK=H/nH60rWrSq+wzSFpHzpZpllvTYkl81DYdqf438PajQVUF8qS2IhBT6TDIYstyV1D3+8OG7SrTm1/+iYn6rOU1jNYykQD8G2bmkBWQAGfNp7010erstKXHmMqm7bTiJ+0apHNCQGji2oTS6dCkQxLes6x3gvYBzMQNkYRINl/oNnoTHqGT3jRvTNzwN0AiVLgjRw6LMux92WM9gKsskgTJ0heT9fB+w0viEXcvvx43vsnH2pJZyceGS0uRCEfOZPZxyaWOrqT5bxhXbivhCVnf3LzkvnBF/XIw2O29H2TLjbJtENkBVQmf+Pj4KVEcw1qtecCEKFuLYSiRDjfZLThefPpxiq5oRQ0QuIj9sKgy9yrJMuchd/9gvmMQEVxk3V+ZA3N4VQTlIpVXUrZRbpOfBKu6Kq7c/AQaxdjumxZEanQ2B+YH8c5vaTKf381DxK7gYvlnnaqvCmpaZNcA7fhOltbwI8OpWDQLz5IAR6kwiLOAWW9//tvRtjOw9Tca3ZLs8yliWSqvm23avQATsQI8XOvhsSjB7LCKwYTlw4z4kcH2womDWs2o67FqLVD6K/1phazQh7uxeeWn203nyNmYeDS9qtCDDD7NUJ1Pch6RjCr5ZO4gqj0utp0/uvAnR29JxNC+wkX7r0e73SDgi//Zpao1i1rGGBPfTbDo4l+IVZUxQRP030AXmUGE9jm1JczvvLwY8v2Pxw9uu6XnMYeg==; SPC_SC_OFFLINE_TOKEN=eyJkYXRhIjoiV2d5QTRFQXZFWk0rYlZWWTlKaGdueUF3QkI4czFtTUJEa3pIak1Qd1hDV1JoR2o2QUl0bk8vV25KUGNISEgycUFreXV1SHhxZG5HUlVaT0M2bzFVeFRRTWhTaTFVaVlpVldSeVVlSFkvWW5nVzZDS3ZRNExMaHpTeUVNZTVkajdTbXlDaUkwcHFTdldvVDNFWFc3RFM0anpiMWZqRWZTUXk4akdKR1FNOC9ScUR5MWZFM2drSUJvTXA2RXJZd3R6VHh1ZUFaeUF3TkRzeXZZSWlKZm1ndz09IiwiaXYiOiJBT3pOQmxYcVMxNm9KYVdFT1JXVURnPT0iLCJzaWduIjoiQXhDZk96WEJWaVhRQ1NtMkwxdFFtTVYybzd1c3BaS2Q0SVRqRGtaOXlISmhOK2wwZFBGQUJObGJ1eThqcHVScys5TjU0MHBBNXBHL1lxbjVYazVFQnc9PSJ9; CTOKEN=u1HmZWSTEfC5p7YMrfmd4A%3D%3D; shopee_webUnique_ccd=f%2Fb4GsmskbwYSkyAFzUGJg%3D%3D%7CosVJSugH%2B5Y%2FwyORZXB4y%2BxIpKKChz12lIgJ407a6GAQc7dVbM84w0mX%2FcvfYXsMSZlhpD%2Fc1Ukumw%3D%3D%7CDlxRR2iZV0HcK%2Fug%7C08%7C3; ds=2f88dc15813745523085cf3d42b6fa82",
    //     enfagrow_official_store:
    //       "_gcl_au=1.1.1243085314.1752924685; _fbp=fb.2.1752924685259.255567066372529249; SPC_R_T_ID=A09c+Ge9EKIISqLXsuGojTOmB/DEhjnzsy4xD8VtorSaWZD25neHN7dR8tbBXhGmKQosLPK32dezwwmZenKjAHxWEL/4sViEj0GJ+uih/aW6r/VnF/Q4MOEvPjVC7TovBh8FSgfAyiZLJGfKxGqrxUfylBiYWYdxxCn7pTcQPqY=; SPC_R_T_IV=dkhvTzN1Y2g5U2Y5dm1Dag==; SPC_T_ID=A09c+Ge9EKIISqLXsuGojTOmB/DEhjnzsy4xD8VtorSaWZD25neHN7dR8tbBXhGmKQosLPK32dezwwmZenKjAHxWEL/4sViEj0GJ+uih/aW6r/VnF/Q4MOEvPjVC7TovBh8FSgfAyiZLJGfKxGqrxUfylBiYWYdxxCn7pTcQPqY=; SPC_T_IV=dkhvTzN1Y2g5U2Y5dm1Dag==; SPC_SI=T0B3aAAAAABLbmM3eEdIWv6gPAAAAAAAV1UwVkxrbDc=; SPC_F=fuFv97lkTBP0nMN2LewNgBuk6cATiEg0; REC_T_ID=e7547f79-6493-11f0-88f1-063d6686668a; AMP_TOKEN=%24NOT_FOUND; _ga=GA1.3.539054969.1752924687; _gid=GA1.3.617466207.1752924687; language=en; SPC_SI=T0B3aAAAAABLbmM3eEdIWv6gPAAAAAAAV1UwVkxrbDc=; SPC_SEC_SI=v1-SklJWkJxcXM2N2E1RUg5bXbI2eciylAEhRLNo7w9BuQr/oy326iddvAUXm0ffA88Ha5Uvfr169Vem4v5EIsxXorORDvwJ4VjTgxI9IZK2HM=; _ga_NEYMG30JL4=GS2.1.s1752924686$o1$g0$t1752924704$j42$l0$h0; SC_DFP=yTEbmHGZgWfozLBMsmznNiqbRzLVaawW; SPC_CDS=1ecd4e6a-b9bc-4ea3-9a58-d8210ad62428; SC_SSO_U=3714520; _QPWSDCXHZQA=791c2c14-73f6-455e-e34b-347bb706a761; REC7iLP4Q=2a7841d4-264f-4f1f-acd1-54c3ed0453dd; _sapid=801e5c46ba9c272e854390448d462016dbe8135e2091b04a5332e818; SPC_CDS_CHAT=4a4027f7-93de-4b22-9ff4-109883c55889; SPC_SC_SESSION=gEGRQvWIgsfEYkvS5Dml6JGY8zcp1wloxXQPbmNtiyi0GXfb1+AyX2JkxcBpoeiB3Xqt9GX4PUTUhFNsXfB2sadjFqwKaL+uarmu+vLa+MsYnomLir3S0eqMF5HZblEXuJaa6ltAmDC00RSri/REwBLBIh5QraVIthdLbDpKkVNLWGw7PcWS8WqJil2I+6Os5ngJMXGcpMFnfjhHvAy/aCiHJGA6J2muSKuL+LTftmKLA2YOfTIjvkpYrsds4YPFNh39pGb0A6vW8so3f2rsnnnGJePSxD5C5N9kupjZA2+2+qsAFASPCKQQlG1nd/5qIsKPUiWbn19eZdIT73Z7sD5kDxbnfuhKKBDrMoaQ2QRCf5Pa9DAKxm6t4BJu3csRLBGs7a74FSMAo/6ewwpn1BoCnCsm50avBQOZallJOccs=_2_3714520; SC_SSO=VDRHSHdOaEsxcXRYV3NYRr2rskp8MQ3euQx/nDotmNaIBsi+tdkHf2yOPJJbq8Fr; SPC_STK=iqq5dYMf9D2zCIWn3O2o9ORu9qP1b6GYfTCBHZFGUI/S5d28Epv2E+fr7pNLD1bgPTJs3Z9sgTbYprkl+gUlv+y5jjvQIpcGWW5+L1RcdZ/CHRt3NUOT8ByM+EWussSvEB+zAAfL2opGI7ChdI3KY35rhf48cE7QdbIDJFzkwh6nljhPLk7oWeN7fVXk4wYuCDD5tiNJpzEsiUKWoXmnmX/klDfjtvMymWIheRFx5Yvi0GcUfi5HzMf0dBAoV1hJIdCU6YplWSM68DlAeTiVexWKF6LGLQEDOsxM1n2x+wsRwd4ujtkJKCzt3iACTu5YsgCcZ+SWJ7hXBNXm5fYGWEzG75rxJzdNcJtCbh91i7rfevEGX5UYkYZztwli4nZlzAQWEVC36amhb0o5AGogNkfT1udA1kmJrTI/Kg0Dh5qZ/PShYnUXV7tZPj0I9zCJvfkA5VVmN7rU6q1WGF0KCJuJi2oWzslbLWUorsRawvikZv1Q+uf/7XbS5XxfvA9ooarP9iIlYq41Q8zD/3+cag3GRsaPW9m9vG4k786QpYLt2QrkzfiCMqQU3eSl4TM7Lz9nB4jUmJF6t+b+LFCW+wX913o8FxiaCwD2EF9Xs2vbij3bhmLkBhOkAfoyHVwiqdvlpffF9Lx1mpElyG15OdPyVNTARntuIHx2amlCuQlSA4CAu9LtSd3biHZWWt2cS5gwI2LWmFrCF1Gs3TlfqA==; SPC_SC_OFFLINE_TOKEN=eyJkYXRhIjoicHVZZFlEcEJFeS9MNGJMbUxvU0d0MVhjOFJxcDMyUHZZVW45Nnl6b3hHOVVlbDNHS2tpOGpFeFIvOUpTZzB6UHdab1Bid2tPU2FkL2l0LzBOOWQ3TGx4NW5oUm9scHdhVTQ3SGhHby9idFg0c0ZLeXMyZUJkRitMMTN5WExyNHhmdFpneTdqOXBrdnRCYXJkTlc4dFY4T2M2RnpHTWsvb3VzemE1RnJXY21LUFRFWjVsakNBb3R4M3dKamttYUs0Y29ObUsvSW1SeWR1TXorY2FqRFdLZz09IiwiaXYiOiJyZ1k1bjk0R2N6OE5rTzdmOFByOVJnPT0iLCJzaWduIjoiRmRaUnowMnB6WndsNit5eWx0NkRaM0FlbFF5NG9lbUpPOStiUVk3MFNKanJqSlZsTVBKT2h3RCs2R3dlcUJzQnVmRm1xT1NQTnF1RmZzbEhyREc1QXc9PSJ9; CTOKEN=CRGlHmSUEfCFb%2BYbohjJzg%3D%3D; shopee_webUnique_ccd=YVDS08xZAR0yHy17GyHpkQ%3D%3D%7CvwsX3VKkI7ltp18chOAVPEAU8pEy%2FkEp7ztTkdtFbRL0RiulEzxiREnfH0vbnWWlFoQLQ1xRQV5W%2FA%3D%3D%7CX5jU39jxRNKJeiBQ%7C08%7C3; ds=31b7b38b0a25ac2fad753883114fe521",
    //   },
    // };
    // console.log("resp:", resp.data);
    if (resp.data) {
      // Always normalize to array-of-objects: [{store: cookieString}, ...]
      if (Array.isArray(resp.data)) {
        return resp.data;
      } else if (typeof resp.data === "object" && resp.data !== null) {
        return Object.entries(resp.data).map(([store, cookieString]) => ({
          [store]: cookieString,
        }));
      }
    }
    throw new Error("Invalid cookies response");
  } catch (err) {
    throw new Error("Failed to fetch cookies: " + err.message);
  }
}

module.exports = { fetchTalabatTokenArray, fetchTalabatCookies };
