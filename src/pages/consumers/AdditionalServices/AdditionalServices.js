import React, { useEffect, useState } from "react";
import { Typography, Collapse, Table } from "antd";
import axios from "axios";
import pdfIcon from "../../../img/pdf.svg";
import docxIcon from "../../../img/docx.svg";
import { addressServer } from "../../../config";
import { motion } from "framer-motion";
import TopImage from "../../../components/TopImage";
import imgTop from "../../../img/4c2c362e8d8fa557788c556795d32fae.jpg";
import styles from "./AdditionalServices.module.css";
import MarkDownText from "../../../components/MarkDownText/MarkDownText";

const { Paragraph } = Typography;

const getIconByExtension = (ext) => {
  const extension = ext.replace(".", "").toLowerCase();
  switch (extension) {
    case "pdf":
      return <img src={pdfIcon} alt="PDF" className={styles.icon} />;
    case "doc":
    case "docx":
      return <img src={docxIcon} alt="DOCX" className={styles.icon} />;
    default:
      return null;
  }
};

const AdditionalServices = () => {
  const [services, setServices] = useState([]);
  const [priceData, setPriceData] = useState([]);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [priceFileData, setPriceFileData] = useState(null);

  // Функция для получения всех данных цен
  const fetchAllPriceData = async () => {
    let page = 1;
    const pageSize = 100; // Максимальное значение pageSize в Strapi по умолчанию
    let totalPages = 1;
    let allData = [];

    try {
      do {
        const response = await axios.get(
          `https://www.mosoblenergo.ru/back/api/prajs-dop-uslugs?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
        );
        const data = response.data.data;
        allData = allData.concat(data);

        // Обновляем общее количество страниц на основе ответа
        const pagination = response.data.meta.pagination;
        totalPages = pagination.pageCount;
        page++;
      } while (page <= totalPages);

      return allData;
    } catch (error) {
      console.error("Ошибка при получении данных цен:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Запрос к первому API
        const response1 = await axios.get(
          "https://www.mosoblenergo.ru/back/api/dopolnitelnye-uslugi?populate[0]=section&populate[1]=section.documents&populate[2]=price&populate[3]=section.sectionName"
        );
        const data1 = response1.data.data.attributes;
        const servicesData = data1.section;
        const descriptionData = data1.description;
        const priceFileData = data1.price?.data?.attributes || null;

        // Получаем все данные цен
        const allPriceData = await fetchAllPriceData();

        setServices(servicesData);
        setPriceData(allPriceData);
        setDescription(descriptionData);
        setPriceFileData(priceFileData);
        setIsLoading(false);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderContent = (content) => {
    return <MarkDownText>{content}</MarkDownText>;
  };

  const renderPriceTable = (sectionName) => {
    // Фильтруем данные по названию секции
    const filteredData = priceData.filter(
      (item) => item.attributes.sectionName?.name === sectionName
    );

    if (filteredData.length === 0) {
      return null;
    }

    // Сортируем данные по полю 'sort'
    filteredData.sort((a, b) => a.attributes.sort - b.attributes.sort);

    // Формируем dataSource, используя данные из Strapi
    const dataSource = filteredData.map((item, index) => {
      const { attributes } = item;

      if (attributes.isSubSection) {
        // Если это подраздел
        return {
          key: `subsection-${index}`,
          isSubSectionHeader: true,
          subSectionName: attributes.subSectionName,
        };
      } else {
        // Если это обычная запись
        return {
          key: index,
          code: attributes.code,
          name: attributes.name,
          unit: attributes.unit,
          price: attributes.price,
          isSubSectionHeader: false,
          rowSpanCode: attributes.rowSpanCode || 1,
          rowSpanName: attributes.rowSpanName || 1,
          rowSpanUnit: attributes.rowSpanUnit || 1,
          rowSpanPrice: attributes.rowSpanPrice || 1,
        };
      }
    });

    // Формируем колонки для таблицы
    const columns = [
      {
        title: "Код",
        dataIndex: "code",
        key: "code",
        render: (text, record) => {
          if (record.isSubSectionHeader) {
            return {
              children: <strong>{record.subSectionName}</strong>,
              props: {
                colSpan: 4,
              },
            };
          }
          return text;
        },
        onCell: (record) => {
          if (record.isSubSectionHeader) {
            return {};
          }
          return {
            rowSpan: record.rowSpanCode,
          };
        },
      },
      {
        title: "Наименование услуги",
        dataIndex: "name",
        key: "name",
        render: (text, record) => {
          if (record.isSubSectionHeader) {
            return {
              props: {
                colSpan: 0,
              },
            };
          }
          return text;
        },
        onCell: (record) => {
          if (record.isSubSectionHeader) {
            return {
              colSpan: 0,
            };
          }
          return {
            rowSpan: record.rowSpanName,
          };
        },
      },
      {
        title: "Ед. измерения",
        dataIndex: "unit",
        key: "unit",
        render: (text, record) => {
          if (record.isSubSectionHeader) {
            return {
              props: {
                colSpan: 0,
              },
            };
          }
          return text;
        },
        onCell: (record) => {
          if (record.isSubSectionHeader) {
            return {
              colSpan: 0,
            };
          }
          return {
            rowSpan: record.rowSpanUnit,
          };
        },
      },
      {
        title: "Цена, руб. с НДС",
        dataIndex: "price",
        key: "price",
        render: (text, record) => {
          if (record.isSubSectionHeader) {
            return {
              props: {
                colSpan: 0,
              },
            };
          }
          return text;
        },
        onCell: (record) => {
          if (record.isSubSectionHeader) {
            return {
              colSpan: 0,
            };
          }
          return {
            rowSpan: record.rowSpanPrice,
          };
        },
      },
    ];

    return (
      <div className={styles["wrap-table"]}>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowClassName={(record) =>
            record.isSubSectionHeader ? styles.subSectionRow : ""
          }
          bordered
          tableLayout="fixed"
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="page-grid__content" id="content">
        <p>Загрузка...</p>
      </div>
    );
  }

  const items = services.map((section, index) => ({
    key: index.toString(),
    label: (
      <div className="accordion-row__up">
        <span className="accordion-row__text">{section.title}</span>
      </div>
    ),
    children: (
      <>
        {/* Контактная информация */}
        <Paragraph>
          По вопросам оказания дополнительных услуг свяжитесь с нами: тел.:{" "}
          <a href="tel:+74957803962">
            <b>8 (495) 780-39-62</b>
          </a>{" "}
          доб. 3327, доб. 1096; e-mail:{" "}
          <a href="mailto:uslugi@mosoblenergo.ru">
            <b>uslugi@mosoblenergo.ru</b>
          </a>
        </Paragraph>

        {/* Документы */}
        {section.documents?.data && (
          <ul className={styles.list}>
            {section.documents.data.map((doc, idx) => (
              <li key={idx}>
                <a
                  href={`${addressServer}${doc.attributes.url}`}
                  className={styles.documentLink}
                >
                  {getIconByExtension(doc.attributes.ext)}
                  {doc.attributes.name}
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Контент секции */}
        {section.content && renderContent(section.content)}

        {/* Таблица прайсов */}
        {renderPriceTable(section.sectionName.name)}
      </>
    ),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <TopImage image={imgTop} title={"Дополнительные услуги"} />
      <div className="page-grid__content" id="content">
        <Collapse
          accordion
          className={styles.accordion}
          items={items}
          expandIcon={() => null}
        />

        {/* Отображение завершающего абзаца */}
        {description && (
          <div className={styles.description}>
            <MarkDownText>{description}</MarkDownText>
          </div>
        )}

        {/* Ссылка на скачивание прейскуранта */}
        {priceFileData && (
          <div className="row-docs-age">
            <a
              className="doc-line"
              href={`${addressServer}${priceFileData.url}`}
              download
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="doc-line__wrap-icon">
                {getIconByExtension(priceFileData.ext)}
              </div>
              <div className="doc-line__wrap-text">
                <span className="doc-line__name">
                  {priceFileData.name || "Скачать файл"}
                </span>
                <span className="doc-line__file-info">
                  {priceFileData.ext.replace(".", "")},{" "}
                  {Math.round(priceFileData.size / 1024)} КБ
                </span>
              </div>
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdditionalServices;

// import React, { useEffect, useState } from "react";
// import { Typography, Collapse, Table } from "antd";
// import axios from "axios";
// import pdfIcon from "../../../img/pdf.svg";
// import docxIcon from "../../../img/docx.svg";
// import { addressServer } from "../../../config";
// import { motion } from "framer-motion";
// import TopImage from "../../../components/TopImage";
// import imgTop from "../../../img/4c2c362e8d8fa557788c556795d32fae.jpg";
// import styles from "./AdditionalServices.module.css";
// import MarkDownText from "../../../components/MarkDownText/MarkDownText";

// const { Paragraph } = Typography;

// const getIconByExtension = (ext) => {
//   const extension = ext.replace(".", "").toLowerCase();
//   switch (extension) {
//     case "pdf":
//       return <img src={pdfIcon} alt="PDF" className={styles.icon} />;
//     case "doc":
//     case "docx":
//       return <img src={docxIcon} alt="DOCX" className={styles.icon} />;
//     default:
//       return null;
//   }
// };

// const AdditionalServices = () => {
//   const [services, setServices] = useState([]);
//   const [priceData, setPriceData] = useState([]);
//   const [description, setDescription] = useState("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [priceFileData, setPriceFileData] = useState(null);

//   // Функция для получения всех данных цен
//   const fetchAllPriceData = async () => {
//     let page = 1;
//     const pageSize = 100; // Максимальное значение pageSize в Strapi по умолчанию
//     let totalPages = 1;
//     let allData = [];

//     try {
//       do {
//         const response = await axios.get(
//           `https://www.mosoblenergo.ru/back/api/prajs-dop-uslugs?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
//         );
//         const data = response.data.data;
//         allData = allData.concat(data);

//         // Обновляем общее количество страниц на основе ответа
//         const pagination = response.data.meta.pagination;
//         totalPages = pagination.pageCount;
//         page++;
//       } while (page <= totalPages);

//       return allData;
//     } catch (error) {
//       console.error("Ошибка при получении данных цен:", error);
//       throw error;
//     }
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         // Запрос к первому API
//         const response1 = await axios.get(
//           "https://www.mosoblenergo.ru/back/api/dopolnitelnye-uslugi?populate[0]=section&populate[1]=section.documents&populate[2]=price&populate[3]=section.sectionName"
//         );
//         const data1 = response1.data.data.attributes;
//         const servicesData = data1.section;
//         const descriptionData = data1.description;
//         const priceFileData = data1.price?.data?.attributes || null;

//         // Получаем все данные цен
//         const allPriceData = await fetchAllPriceData();

//         setServices(servicesData);
//         setPriceData(allPriceData);
//         setDescription(descriptionData);
//         setPriceFileData(priceFileData);
//         setIsLoading(false);
//       } catch (error) {
//         console.error("Ошибка при получении данных:", error);
//         setIsLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const renderContent = (content) => {
//     return <MarkDownText>{content}</MarkDownText>;
//   };

//   const renderPriceTable = (sectionName) => {
//     // Фильтруем данные по названию секции
//     const filteredData = priceData.filter(
//       (item) => item.attributes.sectionName?.name === sectionName
//     );

//     if (filteredData.length === 0) {
//       return null;
//     }

//     // Сортируем данные по полю 'sort'
//     filteredData.sort((a, b) => a.attributes.sort - b.attributes.sort);

//     // Формируем данные для таблицы с учетом `rowSpan`
//     const dataSource = [];
//     const dataLength = filteredData.length;
//     let i = 0;

//     while (i < dataLength) {
//       const currentItem = filteredData[i];
//       const current = currentItem.attributes;

//       if (current.isSubSection) {
//         // Добавляем подраздел в dataSource
//         dataSource.push({
//           key: `subsection-${i}`,
//           isSubSectionHeader: true,
//           subSectionName: current.subSectionName,
//         });
//         i++;
//         continue;
//       }

//       // Начинаем группировку данных для объединения ячеек в "Код" и "Наименование услуги"
//       let rowSpanCode = 1;
//       let rowSpanName = 1;

//       const currentCode = current.code;
//       const currentName = current.name;

//       let j = i + 1;

//       while (j < dataLength) {
//         const nextItem = filteredData[j];
//         const next = nextItem.attributes;

//         if (next.isSubSection) {
//           break; // Прерываем, если встретили подраздел
//         }

//         if (next.code === currentCode && next.name === currentName) {
//           rowSpanCode++;
//           rowSpanName++;
//           j++;
//         } else {
//           break;
//         }
//       }

//       // Теперь внутри группы вычисляем rowSpan для столбца "Цена"
//       let k = i;
//       while (k < j) {
//         const priceGroupStartIndex = k;
//         const currentPrice = filteredData[k].attributes.price;

//         let rowSpanPrice = 1;
//         k++;

//         while (k < j && filteredData[k].attributes.price === currentPrice) {
//           rowSpanPrice++;
//           k++;
//         }

//         // Добавляем первую запись в группе цен
//         dataSource.push({
//           key: priceGroupStartIndex,
//           code: filteredData[priceGroupStartIndex].attributes.code,
//           name: filteredData[priceGroupStartIndex].attributes.name,
//           unit: filteredData[priceGroupStartIndex].attributes.unit,
//           price: filteredData[priceGroupStartIndex].attributes.price,
//           isSubSectionHeader: false,
//           rowSpanCode: priceGroupStartIndex === i ? rowSpanCode : 0,
//           rowSpanName: priceGroupStartIndex === i ? rowSpanName : 0,
//           rowSpanUnit: 1,
//           rowSpanPrice: rowSpanPrice,
//         });

//         // Добавляем остальные записи в группе цен с rowSpanPrice = 0
//         for (
//           let m = priceGroupStartIndex + 1;
//           m < priceGroupStartIndex + rowSpanPrice;
//           m++
//         ) {
//           dataSource.push({
//             key: m,
//             code: filteredData[m].attributes.code,
//             name: filteredData[m].attributes.name,
//             unit: filteredData[m].attributes.unit,
//             price: filteredData[m].attributes.price,
//             isSubSectionHeader: false,
//             rowSpanCode: 0,
//             rowSpanName: 0,
//             rowSpanUnit: 1,
//             rowSpanPrice: 0,
//           });
//         }
//       }

//       i = j; // Переходим к следующей группе
//     }

//     // Формируем колонки для таблицы
//     const columns = [
//       {
//         title: "Код",
//         dataIndex: "code",
//         key: "code",
//         render: (text, record) => {
//           if (record.isSubSectionHeader) {
//             return {
//               children: <strong>{record.subSectionName}</strong>,
//               props: {
//                 colSpan: 4,
//               },
//             };
//           }
//           return text;
//         },
//         onCell: (record) => {
//           if (record.isSubSectionHeader) {
//             return {};
//           }
//           return {
//             rowSpan: record.rowSpanCode,
//           };
//         },
//       },
//       {
//         title: "Наименование услуги",
//         dataIndex: "name",
//         key: "name",
//         render: (text, record) => {
//           if (record.isSubSectionHeader) {
//             return {
//               props: {
//                 colSpan: 0,
//               },
//             };
//           }
//           return text;
//         },
//         onCell: (record) => {
//           if (record.isSubSectionHeader) {
//             return {
//               colSpan: 0,
//             };
//           }
//           return {
//             rowSpan: record.rowSpanName,
//           };
//         },
//       },
//       {
//         title: "Ед. измерения",
//         dataIndex: "unit",
//         key: "unit",
//         render: (text, record) => {
//           if (record.isSubSectionHeader) {
//             return {
//               props: {
//                 colSpan: 0,
//               },
//             };
//           }
//           return text;
//         },
//         onCell: (record) => {
//           if (record.isSubSectionHeader) {
//             return {
//               colSpan: 0,
//             };
//           }
//           return {}; // Не устанавливаем rowSpan
//         },
//       },
//       {
//         title: "Цена, руб. с НДС",
//         dataIndex: "price",
//         key: "price",
//         render: (text, record) => {
//           if (record.isSubSectionHeader) {
//             return {
//               props: {
//                 colSpan: 0,
//               },
//             };
//           }
//           return text;
//         },
//         onCell: (record) => {
//           if (record.isSubSectionHeader) {
//             return {
//               colSpan: 0,
//             };
//           }
//           return {
//             rowSpan: record.rowSpanPrice,
//           };
//         },
//       },
//     ];

//     return (
//       <div className={styles["wrap-table"]}>
//         <Table
//           columns={columns}
//           dataSource={dataSource}
//           pagination={false}
//           rowClassName={(record) =>
//             record.isSubSectionHeader ? styles.subSectionRow : ""
//           }
//           bordered
//           tableLayout="fixed"
//         />
//       </div>
//     );
//   };

//   if (isLoading) {
//     return (
//       <div className="page-grid__content" id="content">
//         <p>Загрузка...</p>
//       </div>
//     );
//   }

//   const items = services.map((section, index) => ({
//     key: index.toString(),
//     label: (
//       <div className="accordion-row__up">
//         <span className="accordion-row__text">{section.title}</span>
//       </div>
//     ),

//     children: (
//       <>
//         {/* Контактная информация */}
//         <Paragraph>
//           По вопросам оказания дополнительных услуг свяжитесь с нами: тел.:{" "}
//           <a href="tel:+74957803962">
//             <b>8 (495) 780-39-62</b>
//           </a>{" "}
//           доб. 3327, доб. 1096; e-mail:{" "}
//           <a href="mailto:uslugi@mosoblenergo.ru">
//             <b>uslugi@mosoblenergo.ru</b>
//           </a>
//         </Paragraph>

//         {/* Документы */}
//         {section.documents?.data && (
//           <ul className={styles.list}>
//             {section.documents.data.map((doc, idx) => (
//               <li key={idx}>
//                 <a
//                   href={`${addressServer}${doc.attributes.url}`}
//                   className={styles.documentLink}
//                 >
//                   {getIconByExtension(doc.attributes.ext)}
//                   {doc.attributes.name}
//                 </a>
//               </li>
//             ))}
//           </ul>
//         )}

//         {/* Контент секции */}
//         {section.content && renderContent(section.content)}

//         {/* Таблица прайсов */}
//         {renderPriceTable(section.sectionName.name)}
//       </>
//     ),
//   }));

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.5 }}
//     >
//       <TopImage image={imgTop} title={"Дополнительные услуги"} />
//       <div className="page-grid__content" id="content">
//         <Collapse
//           accordion
//           className={styles.accordion}
//           items={items}
//           expandIcon={() => null}
//         />

//         {/* Отображение завершающего абзаца */}
//         {description && (
//           <div className={styles.description}>
//             <MarkDownText>{description}</MarkDownText>
//           </div>
//         )}

//         {/* Ссылка на скачивание прейскуранта */}
//         {priceFileData && (
//           <div className="row-docs-age">
//             <a
//               className="doc-line"
//               href={`${addressServer}${priceFileData.url}`}
//               download
//               rel="noopener noreferrer"
//               target="_blank"
//             >
//               <div className="doc-line__wrap-icon">
//                 {getIconByExtension(priceFileData.ext)}
//               </div>
//               <div className="doc-line__wrap-text">
//                 <span className="doc-line__name">
//                   {priceFileData.name || "Скачать файл"}
//                 </span>
//                 <span className="doc-line__file-info">
//                   {priceFileData.ext.replace(".", "")},{" "}
//                   {Math.round(priceFileData.size / 1024)} КБ
//                 </span>
//               </div>
//             </a>
//           </div>
//         )}
//       </div>
//     </motion.div>
//   );
// };

// export default AdditionalServices;

// import React, { useEffect, useState } from "react";
// import { Typography, Collapse, Table } from "antd";
// import axios from "axios";
// import pdfIcon from "../../../img/pdf.svg";
// import docxIcon from "../../../img/docx.svg";
// import { addressServer } from "../../../config";
// import { motion } from "framer-motion";
// import TopImage from "../../../components/TopImage";
// import imgTop from "../../../img/4c2c362e8d8fa557788c556795d32fae.jpg";
// import styles from "./AdditionalServices.module.css";
// import MarkDownText from "../../../components/MarkDownText/MarkDownText";

// const { Paragraph } = Typography;

// const getIconByExtension = (ext) => {
//   const extension = ext.replace(".", "").toLowerCase();
//   switch (extension) {
//     case "pdf":
//       return <img src={pdfIcon} alt="PDF" className={styles.icon} />;
//     case "doc":
//     case "docx":
//       return <img src={docxIcon} alt="DOCX" className={styles.icon} />;
//     default:
//       return null;
//   }
// };

// const AdditionalServices = () => {
//   const [services, setServices] = useState([]);
//   const [priceData, setPriceData] = useState([]);
//   const [description, setDescription] = useState("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [priceFileData, setPriceFileData] = useState(null);

//   // Функция для получения всех данных цен
//   const fetchAllPriceData = async () => {
//     let page = 1;
//     const pageSize = 100; // Максимальное значение pageSize в Strapi по умолчанию
//     let totalPages = 1;
//     let allData = [];

//     try {
//       do {
//         const response = await axios.get(
//           `https://www.mosoblenergo.ru/back/api/prajs-dop-uslugs?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
//         );
//         const data = response.data.data;
//         allData = allData.concat(data);

//         // Обновляем общее количество страниц на основе ответа
//         const pagination = response.data.meta.pagination;
//         totalPages = pagination.pageCount;
//         page++;
//       } while (page <= totalPages);

//       return allData;
//     } catch (error) {
//       console.error("Ошибка при получении данных цен:", error);
//       throw error;
//     }
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         // Запрос к первому API
//         const response1 = await axios.get(
//           "https://www.mosoblenergo.ru/back/api/dopolnitelnye-uslugi?populate[0]=section&populate[1]=section.documents&populate[2]=price&populate[3]=section.sectionName"
//         );
//         const data1 = response1.data.data.attributes;
//         const servicesData = data1.section;
//         const descriptionData = data1.description;
//         const priceFileData = data1.price?.data?.attributes || null;

//         // Получаем все данные цен
//         const allPriceData = await fetchAllPriceData();

//         setServices(servicesData);
//         setPriceData(allPriceData);
//         setDescription(descriptionData);
//         setPriceFileData(priceFileData);
//         setIsLoading(false);
//       } catch (error) {
//         console.error("Ошибка при получении данных:", error);
//         setIsLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const renderContent = (content) => {
//     return <MarkDownText>{content}</MarkDownText>;
//   };

//   const renderPriceTable = (sectionName) => {
//     // Фильтруем данные по названию секции
//     const filteredData = priceData.filter(
//       (item) => item.attributes.sectionName?.name === sectionName
//     );

//     if (filteredData.length === 0) {
//       return null;
//     }

//     // Сортируем данные по полю 'sort'
//     filteredData.sort((a, b) => a.attributes.sort - b.attributes.sort);

//     // Формируем данные для таблицы
//     const dataSource = [];
//     filteredData.forEach((item, index) => {
//       const attributes = item.attributes;

//       if (attributes.isSubSection) {
//         // Добавляем строку для названия подраздела
//         dataSource.push({
//           key: `subsection-${index}`,
//           isSubSectionHeader: true,
//           subSectionName: attributes.subSectionName,
//         });
//       } else {
//         // Добавляем обычную строку данных
//         dataSource.push({
//           key: index,
//           code: attributes.code,
//           name: attributes.name,
//           unit: attributes.unit,
//           price: attributes.price,
//           rowSpan: attributes.rowSpan,
//         });
//       }
//     });

//     // Формируем колонки для таблицы
//     const columns = [
//       {
//         title: "Код",
//         dataIndex: "code",
//         key: "code",
//         render: (text, record) => {
//           if (record.isSubSectionHeader) {
//             return {
//               children: <strong>{record.subSectionName}</strong>,
//               props: {
//                 colSpan: 4, // Объединяем все столбцы
//               },
//             };
//           }
//           return text;
//         },
//       },
//       {
//         title: "Наименование услуги",
//         dataIndex: "name",
//         key: "name",
//         render: (text, record) => {
//           if (record.isSubSectionHeader) {
//             return {
//               props: {
//                 colSpan: 0, // Объединяем ячейку с предыдущей
//               },
//             };
//           }
//           return text;
//         },
//       },
//       {
//         title: "Ед. измерения",
//         dataIndex: "unit",
//         key: "unit",
//         render: (text, record) => {
//           if (record.isSubSectionHeader) {
//             return {
//               props: {
//                 colSpan: 0,
//               },
//             };
//           }
//           return text;
//         },
//       },
//       {
//         title: "Цена, руб. с НДС",
//         dataIndex: "price",
//         key: "price",
//         render: (text, record) => {
//           if (record.isSubSectionHeader) {
//             return {
//               props: {
//                 colSpan: 0,
//               },
//             };
//           }
//           return text;
//         },
//         onCell: (text, index) => {
//           if (text.rowSpan !== null) {
//             return {
//               rowSpan: text.rowSpan,
//             };
//           }
//         },
//       },
//     ];

//     return (
//       <div className={styles["wrap-table"]}>
//         <Table
//           columns={columns}
//           dataSource={dataSource}
//           pagination={false}
//           rowClassName={(record) =>
//             record.isSubSectionHeader ? styles.subSectionRow : ""
//           }
//         />
//       </div>
//     );
//   };

//   if (isLoading) {
//     return (
//       <div className="page-grid__content" id="content">
//         <p>Загрузка...</p>
//       </div>
//     );
//   }

//   const items = services.map((section, index) => ({
//     key: index.toString(),
//     label: (
//       <div className="accordion-row__up">
//         <span className="accordion-row__text">{section.title}</span>
//       </div>
//     ),
//     children: (
//       <>
//         {/* Контактная информация */}
//         <Paragraph>
//           По вопросам оказания дополнительных услуг свяжитесь с нами: тел.:{" "}
//           <a href="tel:+74957803962">
//             <b>8 (495) 780-39-62</b>
//           </a>{" "}
//           доб. 3327, доб. 1096; e-mail:{" "}
//           <a href="mailto:uslugi@mosoblenergo.ru">
//             <b>uslugi@mosoblenergo.ru</b>
//           </a>
//         </Paragraph>

//         {/* Документы */}
//         {section.documents?.data && (
//           <ul className={styles.list}>
//             {section.documents.data.map((doc, idx) => (
//               <li key={idx}>
//                 <a
//                   href={`${addressServer}${doc.attributes.url}`}
//                   className={styles.documentLink}
//                 >
//                   {getIconByExtension(doc.attributes.ext)}
//                   {doc.attributes.name}
//                 </a>
//               </li>
//             ))}
//           </ul>
//         )}

//         {/* Контент секции */}
//         {section.content && renderContent(section.content)}

//         {/* Таблица прайсов */}
//         {renderPriceTable(section.sectionName.name)}
//       </>
//     ),
//   }));

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.5 }}
//     >
//       <TopImage image={imgTop} title={"Дополнительные услуги"} />
//       <div className="page-grid__content" id="content">
//         <Collapse
//           accordion
//           className={styles.accordion}
//           items={items}
//           expandIcon={() => null}
//         />

//         {/* Отображение завершающего абзаца */}
//         {description && (
//           <div className={styles.description}>
//             <MarkDownText>{description}</MarkDownText>
//           </div>
//         )}

//         {/* Ссылка на скачивание прейскуранта */}
//         {priceFileData && (
//           <div className="row-docs-age">
//             <a
//               className="doc-line"
//               href={`${addressServer}${priceFileData.url}`}
//               download
//               rel="noopener noreferrer"
//               target="_blank"
//             >
//               <div className="doc-line__wrap-icon">
//                 {getIconByExtension(priceFileData.ext)}
//               </div>
//               <div className="doc-line__wrap-text">
//                 <span className="doc-line__name">
//                   {priceFileData.name || "Скачать файл"}
//                 </span>
//                 <span className="doc-line__file-info">
//                   {priceFileData.ext.replace(".", "")},{" "}
//                   {Math.round(priceFileData.size / 1024)} КБ
//                 </span>
//               </div>
//             </a>
//           </div>
//         )}
//       </div>
//     </motion.div>
//   );
// };

// export default AdditionalServices;

// import React, { useEffect, useState } from "react";
// import pdf from "../../../img/pdf.svg";
// import docx from "../../../img/docx.svg";
// import { addressServer } from "../../../config";
// import { motion } from "framer-motion";
// import TopImage from "../../../components/TopImage";
// import img4c2c362e8d8fa557788c556795d32fae from "../../../img/4c2c362e8d8fa557788c556795d32fae.jpg";

// export default function AdditionalServices() {
//   const [services, setServices] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     setIsLoading(true);
//     fetch(`${addressServer}/api/dopolnitelnye-servisies`)
//       .then((response) => {
//         return response.json();
//       })
//       .then((data) => {
//         setIsLoading(false);
//         setServices(data.data);
//       })
//       .catch((err) => {
//         console.log(err);
//         setServices([]);
//       });
//   }, []);
//   const handlerAccordion = (event) => {
//     event.currentTarget.classList.toggle("open-accordion");
//     event.currentTarget
//       .querySelector(".accordion-row__up")
//       .classList.toggle("active");
//     const drop = event.currentTarget.querySelector(".accordion-row__drop-down");
//     if (drop.style.maxHeight == "") {
//       drop.style.maxHeight = `${drop.scrollHeight}px`;
//     } else {
//       drop.style.maxHeight = "";
//     }
//   };
//   const handlerRowUp = (event) => {
//     document.querySelectorAll(".accordion-row");
//     event.currentTarget
//       .closest(".accordion-row")
//       .classList.toggle("open-accordion");
//     event.currentTarget.classList.toggle("active");
//     const drop = event.currentTarget
//       .closest(".accordion-row")
//       .querySelector(".accordion-row__drop-down");
//     if (drop.style.maxHeight == "") {
//       drop.style.maxHeight = `${drop.scrollHeight + 1200}px`;
//     } else {
//       drop.style.maxHeight = "";
//     }
//   };
//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.5 }}
//     >
//       <TopImage
//         image={img4c2c362e8d8fa557788c556795d32fae}
//         title={"Дополнительные услуги"}
//       />
//       <div className="page-grid__content" id="content">
//         <div className="text-area">
//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 1. Техническое и оперативное обслуживание электросетевых
//                 объектов
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <p></p>
//                 <p></p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Zayavka_yuridicheskogo_licza_na_zaklyuchenie_dogovora_tehnicheskogo_obsluzhivaniya_obektov_elektrosetevogo_hozyajstva_81660b069c.doc?updated_at=2022-11-15T07:42:53.791Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Zayavka_individualnogo_predprinimatelya_na_zaklyuchenie_dogovora_tehnicheskogo_obsluzhivaniya_obektov_elektrosetevogo_hozyajstva_0ad3302398.doc?updated_at=2022-11-15T07:42:53.913Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Zayavka_ot_fizicheskogo_licza_na_zaklyuchenie_dogovora_tehnicheskogo_obsluzhivaniya_obektov_elektrosetevogo_hozyajstva_6c11fca5d2.doc?updated_at=2022-11-15T07:42:54.140Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>
//                 <p></p>
//                 <p>
//                   <strong>
//                     Техническое и&nbsp;оперативное обслуживание электрических
//                     сетей
//                   </strong>
//                   &nbsp;— это мероприятия, проводимые специально обученным
//                   электротехническим персоналом с&nbsp;целью обеспечения
//                   бесперебойной работы электрооборудования.
//                 </p>
//                 <p>
//                   Неисправность электроустановки ведет к&nbsp;простоям офисов,
//                   складов, торговых залов, цехов и&nbsp;заводов, что приводит
//                   к&nbsp;финансовым потерям, срывам сроков поставок
//                   и&nbsp;многим другим проблемам.
//                 </p>
//                 <p>
//                   По статистике главной причиной возникновения пожаров
//                   на&nbsp;объектах считается замыкание в&nbsp;электропроводке.
//                   Большинство из&nbsp;них можно было&nbsp;бы избежать,
//                   если&nbsp;бы в&nbsp;электроустановке проводилось периодическое
//                   техническое обслуживание, за&nbsp;время проведения которого
//                   возникшие неисправности можно было обнаружить и&nbsp;устранить
//                   на&nbsp;этапе их&nbsp;возникновения, а&nbsp;не&nbsp;после
//                   аварийного отключения электроустановки, а&nbsp;в&nbsp;худшем
//                   случае&nbsp;— при возникновении пожара.
//                 </p>
//                 <p>
//                   Данные работы имеют право выполнять только компании,
//                   получившие соответствующие разрешения от&nbsp;надзорных
//                   органов, и&nbsp;их&nbsp;работники, подтвердившие свою
//                   квалификацию. Объемы задач и&nbsp;требуемые навыки
//                   к&nbsp;персоналу во&nbsp;время работ достаточно высоки,
//                   поэтому к&nbsp;обслуживанию электрооборудования допускают
//                   только высококвалифицированных инженеров
//                   и&nbsp;электромонтеров.
//                 </p>
//                 <p>
//                   АО «Мособлэнерго» предоставляет услугу по&nbsp;обслуживанию
//                   оборудования силами своего персонала.
//                 </p>
//                 <p>
//                   Наши специалисты произведут осмотр оборудования, осуществят
//                   контроль его работы и&nbsp;все необходимые оперативные
//                   переключения. При необходимости составят техническое задание
//                   на&nbsp;ремонт.
//                 </p>
//                 <p>
//                   <strong>
//                     Обслуживание электрических сетей нашим персоналом позволит
//                     Вам:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p>
//                       отказаться от содержания собственного электротехнического
//                       персонала;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       обеспечить надежное и&nbsp;непрерывное энергоснабжение;
//                     </p>
//                   </li>
//                   <li>
//                     <p>продлить срок службы оборудования;</p>
//                   </li>
//                   <li>
//                     <p>избежать выхода из&nbsp;строя оборудования;</p>
//                   </li>
//                   <li>
//                     <p>исключить простой производства и&nbsp;потерю прибыли.</p>
//                   </li>
//                 </ul>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table>
//                     <tbody>
//                       <tr>
//                         <th style={{ textAlign: "center" }}>Код</th>
//                         <th style={{ textAlign: "center" }}>
//                           Наименование услуги
//                         </th>
//                         <th style={{ textAlign: "center" }}>Ед. измерения</th>
//                         <th style={{ textAlign: "center" }}>
//                           Цена, руб. с НДС
//                         </th>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr> 01-01</nobr>
//                         </td>
//                         <td>Оперативное обслуживание ВЛ-0,4 кВ</td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>01-02</nobr>
//                         </td>
//                         <td>Оперативное обслуживание ВЛ-10, 6 кВ</td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr> 01-03</nobr>
//                         </td>
//                         <td>Оперативное обслуживание КЛ-0,4 кВ</td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr> 01-04</nobr>
//                         </td>
//                         <td>Оперативное обслуживание КЛ-10, 6 кВ</td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr> 01-05</nobr>
//                         </td>
//                         <td>
//                           Оперативное обслуживание ТП, РП, КТП 10-6/0,4 кВ
//                         </td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr> 01-06</nobr>
//                         </td>
//                         <td>
//                           Оперативное обслуживание КРН, ЛР и др. отдельного
//                           оборудования
//                         </td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr> 01-07</nobr>
//                         </td>
//                         <td>Отключение/включение ячейки МВ в ЗТП и РП</td>
//                         <td>объект</td>
//                         <td>4 630,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>01-08</nobr>
//                         </td>
//                         <td>
//                           Отключение/ включение ячейки с ВН или разъединителем
//                         </td>
//                         <td>объект</td>
//                         <td>4 200,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>01-09</nobr>
//                         </td>
//                         <td>
//                           Техническое обслуживание <br />
//                           ТП, РП, КТП 10-6/0,4 кВ;
//                           <br />
//                           ВЛ-10, 6, 0,4 кВ; <br />
//                           КЛ-10, 6, 04 кВ
//                         </td>
//                         <td>
//                           условная едниница <br />
//                           электро-оборудования
//                         </td>
//                         <td>
//                           от 1 128,00
//                           <br />
//                           (в месяц)
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>01-10</nobr>
//                         </td>
//                         <td>
//                           Выезд представителя для указания <br />
//                           подземных и наружных электрических <br />
//                           сетей, приёмку работ, обследование
//                         </td>
//                         <td>1 выезд</td>
//                         <td>7 100,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>01-11</nobr>
//                         </td>
//                         <td>
//                           Выезд представителя (комиссии) на приёмку
//                           <br />
//                           &nbsp;инженерных сетей и сооружений после ремонта,
//                           <br />
//                           &nbsp;реконструкции, строительства без РТП, ТП, КТП
//                           <br />
//                           &nbsp;(за исключением работ, выполняемых <br />
//                           по договорам с АО «Мособлэнерго» <br />и договорам
//                           технологического присоединения)
//                         </td>
//                         <td>1 выезд</td>
//                         <td>9 950,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>01-12</nobr>
//                         </td>
//                         <td>
//                           Выезд представителя (комиссии) на приёмку
//                           <br />
//                           &nbsp;инженерных сетей и сооружений после ремонта,
//                           <br />
//                           &nbsp;реконструкции, строительства с РТП, ТП, КТП
//                           <br />
//                           &nbsp;(за исключением работ, выполняемых <br />
//                           по&nbsp;договорам с АО «Мособлэнерго» <br />и
//                           Договорам технологического присоединения)
//                         </td>
//                         <td>1 выезд</td>
//                         <td>14 250,00</td>
//                       </tr>

//                       <tr>
//                         <td>
//                           <nobr>01-13</nobr>
//                         </td>
//                         <td>
//                           Разовое техническое обслуживание
//                           <br />
//                           &nbsp;трансформаторной подстанции
//                           <br />
//                           &nbsp;заявителя (РТП), <br />с выдачей заключения
//                         </td>
//                         <td>объект</td>
//                         <td>21&nbsp;960,00</td>
//                       </tr>

//                       <tr>
//                         <td>
//                           <nobr>01-14</nobr>
//                         </td>
//                         <td>
//                           Разовое техническое обслуживание
//                           <br />
//                           &nbsp;трансформаторной подстанции
//                           <br />
//                           &nbsp;заявителя (ЗТП, 2БКТП), <br />с выдачей
//                           заключения
//                         </td>
//                         <td>объект</td>
//                         <td>16&nbsp;020,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>01-15</nobr>
//                         </td>
//                         <td>
//                           Разовое техническое обслуживание
//                           <br />
//                           &nbsp;трансформаторной подстанции <br />
//                           заявителя (КТПН, 1БКТП), <br />с выдачей заключения
//                         </td>
//                         <td>объект</td>
//                         <td>12&nbsp;000,00</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 2. Ремонт электросетевых объектов
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_yuridicheskogo_licza_543ad332e0.doc?updated_at=2023-08-30T11:03:18.346Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Forma_zayavki_dlya_individualnyh_predprinimatelej_78e37b533f.doc?updated_at=2023-08-30T11:03:18.164Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_fizicheskih_licz_b8172f82b0.doc?updated_at=2023-08-30T11:03:18.356Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>
//                 <p>
//                   <strong>Ремонт электрических сетей</strong> — мероприятия,
//                   производимые как для восстановления работоспособности
//                   электрических сетей, так и отдельного оборудования.
//                 </p>
//                 <p>
//                   Особенность ремонта устройств электрических сетей заключается
//                   в том, что все работы производятся непосредственно на месте
//                   повреждения. Это обстоятельство требует большой
//                   ответственности, грамотной организации и подготовки рабочего
//                   места с доставкой к месту работ инструмента, механизмов,
//                   приспособлений и материалов, необходимых для ремонта,
//                   выполнения ограждения рабочего места и обеспечения
//                   безопасности труда ремонтного персонала.
//                 </p>
//                 <p>
//                   АО «Мособлэнерго» предоставляет услуги по ремонту линий
//                   электропередач, трансформаторных подстанций и других
//                   электрических сетей. Возможность проведения текущих ремонтов,
//                   плановых и срочных ремонтно-восстановительных работ.
//                 </p>
//                 <p>
//                   Наша компания обладает всеми необходимыми средствами для
//                   качественного производства работ. В нашем распоряжении большой
//                   автопарк специализированной техники, большое количество
//                   запасов материала и запасных частей для разнообразного
//                   электрооборудования.
//                 </p>
//                 <p>
//                   Благодаря высокой квалификации наших работников, наличию
//                   современной техники, большому количеству производственных
//                   отделений, а также строгому соблюдению технических норм, все
//                   работы выполняются максимально качественно и в короткие сроки.
//                 </p>
//                 <p>
//                   За более чем 15 — летний опыт работы на благо Московской
//                   области, тысячи компании доверили свои электрические сети в
//                   наши руки.
//                 </p>
//                 <p>
//                   <strong>
//                     Услуга по ремонту электрических сетей включают в себя:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p>выезд к месту работ;</p>
//                   </li>
//                   <li>
//                     <p>проведение осмотра;</p>
//                   </li>
//                   <li>
//                     <p>
//                       выявление неисправностей в работе электрооборудования;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       составление и согласование с заказчиком дефектной
//                       ведомости объемов работ;
//                     </p>
//                   </li>
//                   <li>
//                     <p>проведение ремонтных работ;</p>
//                   </li>
//                   <li>
//                     <p>
//                       оформление приемо-сдаточной документации по завершении
//                       работ.
//                     </p>
//                   </li>
//                 </ul>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table>
//                     <colgroup>
//                       <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <th style={{ textAlign: "center" }}>Код</th>
//                         <th style={{ textAlign: "center" }}>
//                           Наименование услуги
//                         </th>
//                         <th style={{ textAlign: "center" }}>Ед. измерения</th>
//                         <th style={{ textAlign: "center" }}>
//                           Цена, руб. с НДС
//                         </th>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>02-01</nobr>
//                         </td>
//                         <td>Ремонт ВЛ-0,4&nbsp;кВ</td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>02-02</nobr>
//                         </td>
//                         <td>Ремонт ВЛ-10, 6&nbsp;кВ</td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>02-03</nobr>
//                         </td>
//                         <td>Ремонт КЛ-0,4&nbsp;кВ</td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>02-04</nobr>
//                         </td>
//                         <td>Ремонт КЛ-10, 6&nbsp;кВ</td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>02-05</nobr>
//                         </td>
//                         <td>Ремонт ТП, РП, КТП 10-6/0,4&nbsp;кВ</td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 3. Испытание и диагностика защитных средств, оборудования и
//                 приборов
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_yuridicheskogo_licza_543ad332e0.doc?updated_at=2023-08-30T11:03:18.346Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Forma_zayavki_dlya_individualnyh_predprinimatelej_78e37b533f.doc?updated_at=2023-08-30T11:03:18.164Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_fizicheskih_licz_b8172f82b0.doc?updated_at=2023-08-30T11:03:18.356Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>
//                 <p>
//                   Электрозащитные средства служат для защиты персонала от
//                   поражения электрическим током, воздействия электрической дуги
//                   или электромагнитного поля при работах в электроустановках.
//                   Защитными средствами нужно пользоваться только по их прямому
//                   назначению в электроустановках, напряжением не выше того, на
//                   которое они рассчитаны. Всё оборудование и все средства защиты
//                   при проведении работ в электроустановках должны быть
//                   исправными и испытанными.
//                 </p>
//                 <p>
//                   <strong>
//                     Персоналу любой организации допускается пользоваться
//                     средствами электрозащиты только в рабочем состоянии. Будьте
//                     всегда уверены в безопасности своего персонала и их
//                     снаряжения. Помните, что исправные средства защиты снижают
//                     риск вероятности аварийной ситуации на Вашем объекте!
//                   </strong>
//                 </p>
//                 <p>
//                   <strong>
//                     Испытания и диагностика средств индивидуальной защиты
//                     являются обязательным условием для проверки их пригодности к
//                     использованию, способствуют выявлению неисправностей и
//                     предотвращению несчастных случаев при проведении работ.
//                   </strong>
//                 </p>
//                 <p>
//                   АО «Мособлэнерго» предлагает услуги собственной
//                   электролаборатории, которая выполняет испытание средств
//                   индивидуальной защиты и электроинструмента на специальном
//                   оборудовании с предоставлением официального документа по
//                   результатам испытаний.
//                 </p>
//                 <p>
//                   Испытание средств индивидуальной защиты в лабораторных
//                   условиях предполагает, что они поддаются влиянию определенного
//                   напряжения, которое обычно присутствует при работе с
//                   электроустановками и оборудованием. Предварительно специалисты
//                   проводят осмотр изделий, проверяют их маркировку,
//                   компактность, целостность и общее состояние. Особое внимание
//                   уделяется изоляционному покрытию, которое и обеспечивает
//                   высокий уровень защиты сотрудника во время работы.
//                 </p>
//                 <p>
//                   Испытания проводятся высококвалифицированным персоналом с
//                   соблюдением всех норм в соответствии с Инструкцией по
//                   применению и испытанию средств защиты, используемых в
//                   электроустановках СО 153-34.03.603-2003,утвержденной приказом
//                   Минэнерго России от 30 июня 2003 г. N 261.
//                 </p>
//                 <p>
//                   По окончанию испытаний на изделие ставится соответствующий
//                   штамп, и составляется протокол испытаний, который выдается
//                   клиенту.
//                 </p>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table>
//                     <colgroup>
//                       <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <th style={{ textAlign: "center" }}>Код</th>
//                         <th style={{ textAlign: "center" }}>
//                           Наименование услуги
//                         </th>
//                         <th style={{ textAlign: "center" }}>Ед. измерения</th>
//                         <th style={{ textAlign: "center" }}>
//                           Цена, руб. с НДС
//                         </th>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-01</nobr>
//                         </td>
//                         <td>
//                           Испытание: Боты, галоши, <br />
//                           перчатки резиновые диэлектрические
//                         </td>
//                         <td>Пара</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-02</nobr>
//                         </td>
//                         <td>
//                           Испытание: Инструмент ручной изолирующий,
//                           <br />
//                           &nbsp;накладки изолирующие
//                         </td>
//                         <td>шт.</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-03</nobr>
//                         </td>
//                         <td>Испытание: Клещи изолирующие до 1 кВ</td>
//                         <td>шт.</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-04</nobr>
//                         </td>
//                         <td>Испытание: Клещи изолирующие свыше 1 кВ</td>
//                         <td>шт.</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-05</nobr>
//                         </td>
//                         <td>Испытание: Клещи электроизмерительные до 1 кВ</td>
//                         <td>шт.</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-06</nobr>
//                         </td>
//                         <td>
//                           Испытание: Клещи электроизмерительные
//                           <br />
//                           &nbsp;свыше 1 кВ
//                         </td>
//                         <td>шт.</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-07</nobr>
//                         </td>
//                         <td>Испытание: Указатели низкого напряжения до 1 кВ</td>
//                         <td>шт.</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-08</nobr>
//                         </td>
//                         <td>
//                           Испытание: Указатели высокого напряжения до 35 кВ
//                         </td>
//                         <td>шт.</td>
//                         <td>880,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-09</nobr>
//                         </td>
//                         <td>Испытание: Штанга изолирующая до 1 кВ</td>
//                         <td>шт.</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-10</nobr>
//                         </td>
//                         <td>Испытание: Штанга изолирующая до 35 кВ</td>
//                         <td>шт.</td>
//                         <td>880,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-11</nobr>
//                         </td>
//                         <td>Испытание страховочного каната</td>
//                         <td>шт.</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-12</nobr>
//                         </td>
//                         <td>
//                           Проверка наличия цепи между <br />
//                           заземлителями и заземляемыми <br />
//                           элементами электроустановки
//                         </td>
//                         <td>1 точка</td>
//                         <td>250,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-13</nobr>
//                         </td>
//                         <td>
//                           Испытание электрооборудования, <br />
//                           сборных шин <br />
//                           повышенным напряжением
//                         </td>
//                         <td>1 единица</td>
//                         <td>5 190,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-14</nobr>
//                         </td>
//                         <td>Испытание изолирующих колпаков до 10 кВ</td>
//                         <td>шт.</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-15</nobr>
//                         </td>
//                         <td>Испытание лестницы изолирующей</td>
//                         <td>шт.</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-16</nobr>
//                         </td>
//                         <td>Испытание гибкого изолирующего покрытия до 1 кВ</td>
//                         <td>шт.</td>
//                         <td>680,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-17</nobr>
//                         </td>
//                         <td>
//                           Измерение сопротивления изоляции
//                           <br />
//                           и проверки на целостность кабельной <br />
//                           линии 0,4 кВ мегаомметром
//                         </td>
//                         <td>шт.</td>
//                         <td>9 500,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-18</nobr>
//                         </td>
//                         <td>Определение трассы кабельной линии</td>
//                         <td>100 м.</td>
//                         <td>15 120,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-19</nobr>
//                         </td>
//                         <td>Определение кабельной линии в пучке и прокол</td>
//                         <td>шт.</td>
//                         <td>10 350,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-20</nobr>
//                         </td>
//                         <td>Определение места повреждения кабеля</td>
//                         <td>шт.</td>
//                         <td>30 300,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-21</nobr>
//                         </td>
//                         <td>
//                           Определение электрической прочности трансформаторного
//                           масла (Без выезда)
//                         </td>
//                         <td>проба</td>
//                         <td>2 500,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-22</nobr>
//                         </td>
//                         <td>
//                           Испытание монтёрских когтей, лазов,
//                           <br />
//                           &nbsp;спасательных поясов
//                         </td>
//                         <td>шт.</td>
//                         <td>750,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-23</nobr>
//                         </td>
//                         <td>Испытание образцов кабеля (без выезда)</td>
//                         <td>шт.</td>
//                         <td>4 450,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-24</nobr>
//                         </td>
//                         <td>
//                           Испытание предохранителя типа ПК <br />
//                           (измерение сопротивления изоляции) <br />
//                           (без выезда)
//                         </td>
//                         <td>шт.</td>
//                         <td>от 650</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-25</nobr>
//                         </td>
//                         <td>
//                           Испытание КЛ-6, 10 кВ повышенным
//                           <br />
//                           напряжением с выездом бригады
//                         </td>
//                         <td>испытание</td>
//                         <td>от 11 450</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-26</nobr>
//                         </td>
//                         <td>Тепловизионное обследование электроустановок</td>
//                         <td>объект</td>
//                         <td>от 5 750</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-27</nobr>
//                         </td>
//                         <td>
//                           Измерение сопротивления контура
//                           <br />
//                           &nbsp;заземления
//                           <br />
//                           с изготовлением паспорта заземляющего
//                           <br />
//                           &nbsp;устройства
//                         </td>
//                         <td>испытание</td>
//                         <td>19 950,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-28</nobr>
//                         </td>
//                         <td>
//                           Испытание силового трансформатора <nobr>6-10 кВ</nobr>
//                         </td>
//                         <td>шт.</td>
//                         <td>15 160,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-29</nobr>
//                         </td>
//                         <td>
//                           Испытание масляного/вакуумного выключателя{" "}
//                           <nobr>6-10 кВ</nobr>
//                         </td>
//                         <td>шт.</td>
//                         <td>9 450,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-30</nobr>
//                         </td>
//                         <td>
//                           Измерение временных/скоростных характеристик
//                           выключателя <nobr>6-10 кВ</nobr>
//                         </td>
//                         <td>шт.</td>
//                         <td>5 750,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-31</nobr>
//                         </td>
//                         <td>Шурфование кабельных линий 0,4/6-10 кВ</td>
//                         <td>1 кабель</td>
//                         <td>25 500,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-32</nobr>
//                         </td>
//                         <td>Фазировка кабельной линии/воздушной линии</td>
//                         <td>1 КЛ/ВЛ</td>
//                         <td>12 500,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-33</nobr>
//                         </td>
//                         <td>Определение кабельной линии в пучке</td>
//                         <td>1 кабель</td>
//                         <td>17 000,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>03-34</nobr>
//                         </td>
//                         <td>Прочие испытания</td>
//                         <td>1 единица</td>
//                         <td>индивидуально</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 4. Проектные и строительно-монтажные работы на электросетевых
//                 объектах клиентов
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <p></p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/p_4_forma_zayavki_dlya_yur_licz_abc014898e.doc?updated_at=2022-11-15T07:45:39.087Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/p_4_forma_zayavki_dlya_ind_pred_cb277dc036.doc?updated_at=2022-11-15T07:45:39.458Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/p_4_forma_zayavki_dlya_fiz_licz_d88aad773c.doc?updated_at=2022-11-15T07:45:39.295Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>
//                 <p></p>
//                 <p>
//                   {" "}
//                   АО «Мособлэнерго» предоставляет услуги по проектированию и
//                   строительству электрических сетей любой сложности.
//                 </p>
//                 <p>
//                   {" "}
//                   <strong>
//                     За 15 лет работы наша компания приобрела огромный опыт в
//                     проектировании любых электросетевых объектов:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p>
//                       {" "}
//                       проектирование и строительство трансформаторных подстанций
//                       (ТП), кабельных и воздушных линий электропередачи;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       сборка и монтаж щитов учёта на опорах для возможности
//                       присоединения электрооборудования и электроинструмента на
//                       период строительства;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       технологическое присоединение энергопринимающих устройств
//                       (временных и постоянных строений) на территории земельного
//                       участка;
//                     </p>
//                   </li>
//                   <li>
//                     <p> монтаж вводов и многое другое.</p>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   Все проводимые проектные и строительные работы ведутся с
//                   учетом необходимого уровня надежности электроснабжения
//                   потребителей, нормирования качества электроэнергии, возможного
//                   роста электрических нагрузок.
//                 </p>
//                 <p>
//                   {" "}
//                   АО «Мособлэнерго» имеет все необходимые лицензии для данного
//                   вида деятельности, имеет аттестацию в комиссии Ростехнадзора и
//                   привлекает к выполнению работ высококвалифицированных
//                   специалистов. Благодаря опыту компании и её
//                   клиентоориентированности всем проектам, независимо от их
//                   объема, уделяется одинаково пристальное внимание, поэтому
//                   работы выполняются качественно и в максимально короткие сроки.
//                   По окончании работ АО «Мособлэнерго» может подготовить для Вас
//                   полный пакет документов для представления в Ростехнадзор и
//                   заключения договора электроснабжения.
//                 </p>

//                 <p className="wrap-table"></p>
//                 <p>
//                   Актуальный прайслист Вы можете скачать по ссылке внизу
//                   страницы.
//                 </p>
//                 {/* <table align="center">
//                   <colgroup>
//                     <col /> <col /> <col /> <col />
//                   </colgroup>
//                   <tbody>
//                     <tr>
//                       <th style={{ textAlign: "center" }}>Код</th>
//                       <th style={{ textAlign: "center" }}>
//                         Наименование услуги
//                       </th>
//                       <th style={{ textAlign: "center" }}>
//                         <strong>Ед. измерения</strong>
//                       </th>
//                       <th style={{ textAlign: "center" }}>Цена, руб. с НДС</th>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-01</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Проектно-изыскательские работы
//                         <br />
//                         по строительству, <br />
//                         реконструкции электрических <br />
//                         сетей заявителя
//                       </td>
//                       <td style={{ textAlign: "center" }}>объект</td>
//                       <td style={{ textAlign: "center" }}>индивидуально</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-02</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Выполнение мероприятий <br />
//                         по строительству и реконструкции <br />
//                         электрически сетей заявителя
//                       </td>
//                       <td style={{ textAlign: "center" }}>объект</td>
//                       <td style={{ textAlign: "center" }}>индивидуально</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-03</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Строительно-монтажные работы <br />
//                         по переустройству опор ЛЭП <br />
//                         для размещения технологического <br />
//                         оборудования связи
//                       </td>
//                       <td style={{ textAlign: "center" }}>объект</td>
//                       <td style={{ textAlign: "center" }}>индивидуально</td>
//                     </tr>
//                     <tr>
//                       <td colSpan="4" style={{ textAlign: "center" }}>
//                         <strong>
//                           Монтажные работы электрооборудования до 1000 В (без
//                           материалов)
//                         </strong>
//                       </td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-04</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Исправление схемы включения
//                         <br />
//                         электросчетчика{" "}
//                         <nobr>
//                           1-фазного
//                           <br />
//                         </nobr>
//                         в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>2 000,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-05</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Исправление схемы включения <br />
//                         электросчетчика <nobr>3-фазного</nobr> прямого
//                         <br />и трансформаторного включения
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>2 800,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-06</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Демонтаж <nobr>1-фазного</nobr> <br />
//                         информационно-измерительного <br />
//                         комплекса в сети 0,4 кВ
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>900,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-07</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Демонтаж <nobr>3-фазного</nobr> <br />
//                         информационно-измерительного <br />
//                         комплекса в сети 0,4кВ
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>1 800,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-08</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка шкафа учета <br />в электроустановках до 1000В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>3 550,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-09</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка автоматического выключателя
//                         <br />
//                         <nobr>1-фазного</nobr> в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>1 600,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-10</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка трансформатора тока
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 2 250</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-11</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка электросчетчика{" "}
//                         <nobr>
//                           1-фазного
//                           <br />
//                         </nobr>
//                         в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 2 050</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-12</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка электросчетчика{" "}
//                         <nobr>
//                           3-фазного
//                           <br />
//                         </nobr>
//                         прямого и трансформаторного включения
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 2 950</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-13</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка испытательной коробки
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 1 250</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-14</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Монтаж измерительных цепей
//                         <br />
//                         (вторичных цепей коммутации)
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 5 370</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-15</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка <nobr>1-фазного</nobr> прибора учета
//                         <br />
//                         на опоре ВЛ 0,4 кВ
//                         <br />
//                         (Перенос учета электрической энергии
//                         <br />
//                         на границу балансовой принадлежности)
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 7 700</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-16</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка трехфазного прибора учета
//                         <br />
//                         прямого включения на опоре ВЛ 0,4 кВ
//                         <br />
//                         (Перенос учета электрической энергии
//                         <br />
//                         на границу балансовой принадлежности)
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 10 700</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-17</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка трехфазного прибора учета
//                         <br />
//                         трансформаторного включения
//                         <br />
//                         на опоре ВЛ 0,4 кВ
//                         <br />
//                         (Перенос учета электрической энергии
//                         <br />
//                         на границу балансовой принадлежности)
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 12 300</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-18</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Демонтаж однофазного прибора учета
//                         <br />
//                         на опоре ВЛ 0,4 кВ
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>3 200,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-19</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена плавкой вставки
//                         <br />
//                         предохранителя в электроустановках
//                         <br />
//                         до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 1 200</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-20</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена измерительного комплекса
//                         <br />в сети 0,4кВ в электроустановках
//                         <br />
//                         до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 12 450</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-21</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена шкафа учета
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 5 000</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-22</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена трансформатора тока в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 2 900</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-23</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена испытательной коробки в электроустановках до 1000
//                         В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 1 600</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-24</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена электросчетчика <nobr>1-фазного</nobr> в
//                         электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 2 500</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-25</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена электросчетчика <br />
//                         <nobr>3-фазного</nobr> прямого и трансформаторного
//                         <br />
//                         включения в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 3 500</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-26</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена электросчетчика{" "}
//                         <nobr>
//                           3-фазного
//                           <br />
//                         </nobr>
//                         трансформаторного включения <br />
//                         на прямого включения с перемонтажом
//                         <br />
//                         &nbsp;схемы включения в электроустановках
//                         <br />
//                         &nbsp;до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 7 500</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-27</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена электросчетчика <br />
//                         <nobr>3-фазного</nobr> прямого включения
//                         <br />
//                         на трансформаторного включения
//                         <br />с перемонтажом схемы включения
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 8 500</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-28</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена измерительных цепей
//                         <br />
//                         (вторичных цепей коммутации)
//                         <br />в электроустановках до 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 6 400</td>
//                     </tr>

//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-29</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Монтаж кабельной концевой <br />
//                         муфты 0,4 кВ
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 7 500,00</td>
//                     </tr>

//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-30</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Монтаж кабельной соединительной <br />
//                         &nbsp;муфты 0,4 кВ
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 12 500,00</td>
//                     </tr>

//                     <tr>
//                       <td colSpan="4" style={{ textAlign: "center" }}>
//                         <strong>
//                           Установка автоматического выключателя{" "}
//                           <nobr>3-фазного</nobr> в электроустановках: до 1000В
//                         </strong>
//                       </td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-31</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>До 100 А</td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>1 800,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-32</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>От 100 А до 400 А</td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>2 200,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-33</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Свыше 400 А до 1000 А
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>2 450,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-34</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Свыше 1000 А (согласно сметного расчёта)
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>индивидуально</td>
//                     </tr>
//                     <tr>
//                       <td colSpan="4" style={{ textAlign: "center" }}>
//                         <strong>
//                           Замена автоматического выключателя{" "}
//                           <nobr>3-фазного</nobr> в электроустановках: до 1000В
//                         </strong>
//                       </td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-35</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>до 100 А</td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 2 300</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-36</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>от 100 А до 400 А</td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 2 500</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-37</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         свыше 400 А до 1000 А
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 2 800</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-38</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         свыше 1000 А (согласно сметного расчёта)
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>индивидуально</td>
//                     </tr>
//                     <tr>
//                       <td colSpan="4" style={{ textAlign: "center" }}>
//                         Отключение/подключение энергопринимающих устройств
//                       </td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-39</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Для физических лиц (до 1000 В) (с выездом)
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         1 точка присоединения
//                       </td>
//                       <td style={{ textAlign: "center" }}>2 700,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-40</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Для физических лиц (до 1000 В)
//                         <br />
//                         &nbsp;(дистанционно)*
//                         <br />
//                         *при наличии технической возможности
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         1 точка присоединения
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 350,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-41</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Для юридических лиц (до 1000 В) (с выездом)
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         1 точка присоединения
//                       </td>
//                       <td style={{ textAlign: "center" }}>5 100,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-42</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Для юридических лиц (до 1000 В)
//                         <br />
//                         &nbsp;(дистанционно)* <br />
//                         *при наличии технической возможности
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         1 точка присоединения
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 350,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-43</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Для физических лиц (свыше 1000 В)
//                         <br />
//                         &nbsp;(с выездом)
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         1 точка присоединения
//                       </td>
//                       <td style={{ textAlign: "center" }}>4 500,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-44</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Для физических лиц (свыше 1000 В)
//                         <br />
//                         &nbsp;(дистанционно)*
//                         <br />
//                         &nbsp;*при наличии технической возможности
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         1 точка присоединения
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 350,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-45</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Для юридических лиц (свыше 1000 В)
//                         <br />
//                         &nbsp;(с выездом)
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         1 точка присоединения
//                       </td>
//                       <td style={{ textAlign: "center" }}>7 450,00</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-46</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Для юридических лиц (свыше 1000 В) (дистанционно)*
//                         <br />
//                         &nbsp;*при наличии технической возможности
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         1 точка присоединения
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 350,00</td>
//                     </tr>
//                     <tr>
//                       <td colSpan="4" style={{ textAlign: "center" }}>
//                         <strong>
//                           Монтажные работы электрооборудования свыше 1000 В (без
//                           материалов)
//                         </strong>
//                       </td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-47</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Исправление схемы включения
//                         <br />
//                         электросчетчика{" "}
//                         <nobr>
//                           3-фазного
//                           <br />
//                         </nobr>
//                         трансформаторного включения
//                         <br />в электроустановках свыше 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 6 100</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-48</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка шкафа учета <br />в электроустановках <br />
//                         свыше 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 5 600</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-49</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка трансформатора тока в электроустановках{" "}
//                         <nobr>6-10 кВ</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 13 500</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-50</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка трансформатора напряжения{" "}
//                         <nobr>1-фазного</nobr> в электроустановках{" "}
//                         <nobr>6-10 кВ</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 8 000</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-51</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка трансформатора напряжения{" "}
//                         <nobr>3-фазного</nobr> в электроустановках{" "}
//                         <nobr>6-10 кВ</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 12 200</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-52</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка испытательной коробки в электроустановках
//                         свыше 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 2 400</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-53</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Установка электросчетчика <nobr>3-фазного</nobr>{" "}
//                         трансформаторного включения в электроустановках свыше
//                         1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 5 000</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-54</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Монтаж измерительных цепей
//                         <br />
//                         (вторичных цепей коммутации)
//                         <br />
//                         &nbsp;в электроустановках свыше 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 5 500</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-55</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена шкафа учета в электроустановках свыше 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 6 800</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-56</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена трансформатора тока в электроустановках{" "}
//                         <nobr>6-10 кВ</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 15 200</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-57</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена трансформатора напряжения <nobr>1-фазного</nobr>{" "}
//                         в электроустановках <nobr>6-10 кВ</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 9 300</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-58</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена трансформатора напряжения <nobr>3-фазного</nobr>{" "}
//                         в электроустановках <nobr>6-10 кВ</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 15 250</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-59</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена электросчетчика <nobr>3-фазного</nobr>{" "}
//                         трансформаторного включения в электроустановках свыше
//                         1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 8 000</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-60</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена испытательной коробки в электроустановках свыше
//                         1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 3 200</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-61</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена измерительных цепей
//                         <br />
//                         &nbsp;(вторичных цепей коммутации)
//                         <br />
//                         &nbsp;в электроустановках <br />
//                         свыше 1000 В
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 7 400</td>
//                     </tr>

//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-62</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Монтаж кабельной концевой <br />
//                         муфты 6-10 кВ
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 18&nbsp;000,00</td>
//                     </tr>

//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-63</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Монтаж кабельной соединительной
//                         <br />
//                         &nbsp;муфты 6-10 кВ
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>от 25&nbsp;000,00</td>
//                     </tr>
//                     <tr>
//                       <td colSpan="4" style={{ textAlign: "center" }}>
//                         <strong>Работы общего назначения</strong>
//                       </td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-64</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Пробивка (сверление) отверстий
//                         <br />в кирпичных (ж/б) стенах
//                         <br />
//                         &nbsp;(полах, потолках) толщиной
//                         <br />
//                         &nbsp;до 50 см, диаметр до 25 мм
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>индивидуально</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-65</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Пробивка (сверление) отверстий
//                         <br />в кирпичных (ж/б) стенах
//                         <br />
//                         (полах, потолках) толщиной
//                         <br />
//                         до 50 см, диаметр до 50 мм
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 шт.</td>
//                       <td style={{ textAlign: "center" }}>индивидуально</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-66</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Прокладка трубы ПВХ
//                         <br />
//                         (гофрированной) с креплением
//                         <br />
//                         (скобами, диаметр до 50 мм)
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 м.</td>
//                       <td style={{ textAlign: "center" }}>от 207</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-67</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Затягивание кабеля (провода) в трубы ПВХ диаметром до 50
//                         мм
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 м.</td>
//                       <td style={{ textAlign: "center" }}>от 135</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-68</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Прокладка кабеля навесным монтажом по стенам готовых
//                         строений
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 м.</td>
//                       <td style={{ textAlign: "center" }}>от 270</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-69</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Прокладка кабеля в стенах готовых строений
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 м.</td>
//                       <td style={{ textAlign: "center" }}>от 320</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-70</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Прокладка интерфейсного кабеля
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 м.</td>
//                       <td style={{ textAlign: "center" }}>от 270</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-71</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Демонтаж короба с интерфейсным кабелем
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 м.</td>
//                       <td style={{ textAlign: "center" }}>от 270</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-72</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена провода (кабеля), <br />
//                         проложенного в трубе ПВХ
//                         <br />
//                         (гофрированной) диаметром
//                         <br />
//                         до 50 мм, без демонтажа трубы
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 м.</td>
//                       <td style={{ textAlign: "center" }}>от 270</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-73</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена интерфейсного кабеля
//                         <br />в коробе без демонтажа короба
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 м.</td>
//                       <td style={{ textAlign: "center" }}>от 405</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-74</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Замена кабеля в стенах готовых строений
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 м.</td>
//                       <td style={{ textAlign: "center" }}>от 600</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-75</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Прочие строительно-монтажные работы
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 объект</td>
//                       <td style={{ textAlign: "center" }}>индивидуально</td>
//                     </tr>
//                     <tr>
//                       <td style={{ textAlign: "center" }}>
//                         <nobr>04-76</nobr>
//                       </td>
//                       <td style={{ textAlign: "center" }}>
//                         Внутренние электромонтажные работы&nbsp;
//                         <br />
//                         (дома, офисы, квартиры и т.д.)
//                       </td>
//                       <td style={{ textAlign: "center" }}>1 объект</td>
//                       <td style={{ textAlign: "center" }}>индивидуально</td>
//                     </tr>
//                   </tbody>
//                 </table> */}
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 5. Предоставление доступа к инфраструктуре АО «Мособлэнерго» (за
//                 исключением линий связи ВОЛС)
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_yuridicheskogo_licza_543ad332e0.doc?updated_at=2023-08-30T11:03:18.346Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Forma_zayavki_dlya_individualnyh_predprinimatelej_78e37b533f.doc?updated_at=2023-08-30T11:03:18.164Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_fizicheskih_licz_b8172f82b0.doc?updated_at=2023-08-30T11:03:18.356Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   АО «Мособлэнерго» предоставляет возможность доступа к своей
//                   инфраструктуре, а также площади на собственных объектах в
//                   Московской области, которые будут отвечать высоким стандартам
//                   качества, всем критериям полезности, удобства, имиджа и
//                   авторитета наших клиентов.
//                 </p>
//                 <p>
//                   {" "}
//                   <strong>
//                     Компания располагает помещениями и объектами различного
//                     назначения, поэтому любой клиент сможет найти для себя
//                     интересующий вариант:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p>
//                       {" "}
//                       объекты общего пользования позволят Вам использовать
//                       помещение в качестве офиса, складских помещений и для
//                       других целей;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       площади на крышах зданий и на земельных участках позволяют
//                       клиенту разместить радиобашни, радиомачты и другое
//                       коммуникационное оборудование;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       места для размещения рекламных баннеров — возможность
//                       разместить свою рекламу на здании, земельном участке и
//                       другом недвижимом имуществе;
//                     </p>
//                   </li>
//                   <li>
//                     <p> предоставление мест вне помещений для других целей.</p>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   <strong>
//                     Большой список предоставляемой площади позволит выбрать
//                     наиболее подходящий вариант для Вашего бизнеса.
//                     Использование площадей, предоставляемых нашей компанией,
//                     имеет неоспоримые преимущества:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p> удобство расположения объектов;</p>
//                   </li>
//                   <li>
//                     <p> близкое расположение к источникам электроэнергии;</p>
//                   </li>
//                   <li>
//                     <p> защита от несанкционированного доступа;</p>
//                   </li>
//                   <li>
//                     <p> минимальные затраты на проведение монтажных работ;</p>
//                   </li>
//                   <li>
//                     <p> удобство технического обслуживания.</p>
//                   </li>
//                 </ul>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table>
//                     <colgroup>
//                       <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <th style={{ textAlign: "center" }}>Код</th>
//                         <th style={{ textAlign: "center" }}>
//                           Наименование услуги
//                         </th>
//                         <th style={{ textAlign: "center" }}>
//                           <strong>Ед. измерения</strong>
//                         </th>
//                         <th style={{ textAlign: "center" }}>
//                           Цена, руб. с НДС
//                         </th>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>05-01</nobr>
//                         </td>
//                         <td>
//                           Предоставление места, <br />
//                           площадью 1 кв.м. в помещении
//                           <br />
//                           общего пользования
//                           <br />
//                           (административное здание,
//                           <br />
//                           &nbsp;нетехнологическое помещение)
//                         </td>
//                         <td>кв. м.</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>05-02</nobr>
//                         </td>
//                         <td>
//                           Предоставление места,
//                           <br />
//                           площадью 1 кв.м. <br />
//                           на крыше здания, постройки
//                         </td>
//                         <td>кв. м.</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>05-03</nobr>
//                         </td>
//                         <td>
//                           Предоставление места для установки
//                           <br />
//                           металлоконструкций <br />
//                           (радиомачты, радиобашни),
//                           <br />
//                           на объекте недвижимости <br />
//                           АО «Мособлэнерго»
//                           <br />
//                           &nbsp;в т.ч. на земельном участке
//                         </td>
//                         <td>1 объект</td>
//                         <td>26&nbsp;801,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>05-04</nobr>
//                         </td>
//                         <td>
//                           Предоставление места в коллекторе
//                           <br />
//                           &nbsp;для размещения силового кабеля <br />
//                           до 20 кВ включительно
//                           <br />
//                           &nbsp;(сечением до 240 мм2) <br />
//                           на объекте недвижимости <br />
//                           &nbsp;АО "Мособлэнерго"
//                         </td>
//                         <td>1 км.</td>
//                         <td>12&nbsp;660,00</td>
//                       </tr>

//                       <tr>
//                         <td>
//                           <nobr>05-05</nobr>
//                         </td>
//                         <td>
//                           Предоставление места, <br />
//                           площадью 1 кв.м. <br />
//                           на земельном участке, <br />
//                           вне помещений
//                         </td>
//                         <td>кв. м.</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>05-06</nobr>
//                         </td>
//                         <td>
//                           Предоставление комплекса <br />
//                           ресурсов вне помещений <br />
//                           для размещения кабелей <br />
//                           сторонней организации
//                         </td>
//                         <td>1 метр</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>05-07</nobr>
//                         </td>
//                         <td>
//                           Размещение допустимых типов <br />
//                           рекламных конструкций <br />
//                           на земельных участках, <br />
//                           зданиях и ином <br />
//                           недвижимом имуществе
//                         </td>
//                         <td>шт.</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>05-08</nobr>
//                         </td>
//                         <td>
//                           Предоставление доступа <br />к инфраструктуре для
//                           установки <br />
//                           опор двойного назначения
//                           <br />
//                           (до 100 опор)
//                         </td>
//                         <td>шт.</td>
//                         <td>5 400,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>05-09</nobr>
//                         </td>
//                         <td>
//                           Предоставление доступа <br />к инфраструктуре для
//                           установки <br />
//                           опор двойного назначения <br />
//                           (от 100 опор до 300 опор)
//                         </td>
//                         <td>шт.</td>
//                         <td>5 000,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>05-10</nobr>
//                         </td>
//                         <td>
//                           Предоставление доступа
//                           <br />к инфраструктуре для установки <br />
//                           опор двойного назначения <br />
//                           (свыше 300 опор)
//                         </td>
//                         <td>шт.</td>
//                         <td>4 600,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>05-11</nobr>
//                         </td>
//                         <td>
//                           Разработка Технических условий <br />
//                           на переустройство объекта <br />
//                           (опоры) электроснабжения <br />
//                           АО «Мособлэнерго» <br />
//                           для установки опоры <br />
//                           двойного назначения.
//                         </td>
//                         <td>шт.</td>
//                         <td>19 000,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>13-03</nobr>
//                         </td>
//                         <td>
//                           Тариф за предоставление доступа
//                           <br />
//                           сторонним лицам (пользователям) <br />к воздушным
//                           линиям 0,4 кВ <br />
//                           для размещения оборудования
//                         </td>
//                         <td>1 место подвеса на опоре</td>
//                         <td>74,06</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>13-04</nobr>
//                         </td>
//                         <td>
//                           Тариф за предоставление доступа
//                           <br />
//                           сторонним лицам (пользователям) <br />к воздушным
//                           линиям 6/10 кВ <br />
//                           для размещения оборудования
//                         </td>
//                         <td>1 место подвеса на опоре</td>
//                         <td>99,29</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 6. Консультационные и организационно-технические услуги
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_yuridicheskogo_licza_543ad332e0.doc?updated_at=2023-08-30T11:03:18.346Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Forma_zayavki_dlya_individualnyh_predprinimatelej_78e37b533f.doc?updated_at=2023-08-30T11:03:18.164Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_fizicheskih_licz_b8172f82b0.doc?updated_at=2023-08-30T11:03:18.356Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>
//                 <p>
//                   АО «Мособлэнерго» предлагает своим клиентам широкий спектр
//                   организационно-технических услуг – от консультаций до надзора
//                   за выполняемыми работами.
//                 </p>
//                 <p>
//                   Наша компания готова помочь в решении вопросов, с которыми
//                   потребитель может столкнуться при создании системы
//                   электроснабжения своего объекта.
//                 </p>
//                 <p>
//                   <b>
//                     Знания и опыт АО «Мособлэнерго», осведомленность об
//                     изменениях в нормативно-правовой базе в электроэнергетике
//                     позволяет обеспечить высокое качество оказываемых
//                     предоставляемых услуг.
//                   </b>
//                 </p>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table align="center">
//                     <colgroup>
//                       <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <th style={{ textAlign: "center" }}>Код</th>
//                         <th style={{ textAlign: "center" }}>
//                           Наименование услуги
//                         </th>
//                         <th style={{ textAlign: "center" }}>
//                           <strong>Ед. измерения</strong>
//                         </th>
//                         <th style={{ textAlign: "center" }}>
//                           Цена, руб. с НДС
//                         </th>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-01</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Выдача уведомлений <br />
//                           при осуществлении надзора
//                           <br />
//                           за выполнением строительных работ <br />
//                           вблизи линий электропередач
//                         </td>
//                         <td style={{ textAlign: "center" }}>шт.</td>
//                         <td style={{ textAlign: "center" }}>3 000,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-02</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Консультационные услуги <br />
//                           по вопросам прохождения трасс КЛ <br />
//                           для подготовки проектов строительства <br />и проектов
//                           производства работ (ППР)
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 объект</td>
//                         <td style={{ textAlign: "center" }}>2 500,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-03</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Консультационные услуги <br />
//                           по вопросам реконструкции/строительства <br />
//                           объектов ЛЭП
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 объект</td>
//                         <td style={{ textAlign: "center" }}>2 200,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-04</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Консультация по техническим вопросам <br />с выездом
//                           на объект
//                         </td>
//                         <td style={{ textAlign: "center" }}>шт.</td>
//                         <td style={{ textAlign: "center" }}>от 3 900,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-05</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Надзор за выполнением <br />
//                           сторонними организациями <br />
//                           строительных работ
//                           <br />
//                           вблизи линий электропередачи <br />и другого
//                           электрооборудования
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           1 день (8 часов)
//                         </td>
//                         <td style={{ textAlign: "center" }}>14 300,00</td>
//                       </tr>

//                       <tr>
//                         <td colSpan="4" style={{ textAlign: "center" }}>
//                           <strong>
//                             Допуск бригад сторонних организаций к работам на
//                             объектах АО&nbsp;«Мособлэнерго» по заявке
//                             заинтересованного лица:
//                           </strong>
//                         </td>
//                       </tr>

//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-06</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Допуск бригад сторонних организаций
//                           <br />
//                           &nbsp;к работам в ТП, РТП <br />
//                           для проведения <br />
//                           пуско-наладочных работ
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 допуск</td>
//                         <td style={{ textAlign: "center" }}>7&nbsp;032,00</td>
//                       </tr>

//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-07</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Допуск бригад сторонних организаций
//                           <br />
//                           &nbsp;к работам в охранной зоне
//                           <br />
//                           &nbsp;воздушных линий <br />
//                           0,4 кВ и 6-10 кВ
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 допуск</td>
//                         <td style={{ textAlign: "center" }}>5&nbsp;100,00</td>
//                       </tr>

//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-08</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Допуск бригад сторонних организаций <br />к работам в
//                           охранной зоне <br />
//                           кабельных линий 0,4 кВ и 6-10 кВ
//                           <br />
//                           &nbsp;при производстве земляных работ
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 допуск</td>
//                         <td style={{ textAlign: "center" }}>3&nbsp;504,00</td>
//                       </tr>

//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-09</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Расчет пропускной способности ЛЭП
//                         </td>
//                         <td style={{ textAlign: "center" }}>шт.</td>
//                         <td style={{ textAlign: "center" }}>12 600,00</td>
//                       </tr>
//                       <tr>
//                         <td rowSpan="4" style={{ textAlign: "center" }}>
//                           <nobr>06-10</nobr>
//                         </td>
//                         <td rowSpan="4" style={{ textAlign: "center" }}>
//                           Рассмотрение для согласования
//                           <br />
//                           &nbsp;топографических съемок, <br />
//                           планов и схем границ <br />
//                           земельных участков, <br />
//                           ордеров на право <br />
//                           производства земляных работ,
//                           <br />
//                           &nbsp;кадастровых планов <br />
//                           земельных участков, <br />
//                           проектов планировки территории,
//                           <br />
//                           &nbsp;проектов землеотводов.
//                           <br />
//                           <i>
//                             &nbsp;*услуга оказывается <br />
//                           </i>
//                           <i>
//                             по указанной цене <br />
//                           </i>
//                           <i>
//                             при условии предоставления <br />
//                           </i>
//                           <i>
//                             документов подтверждающих <br />
//                           </i>
//                           <i>
//                             право собственности <br />
//                           </i>
//                           <i>
//                             земельного участка <br />
//                           </i>
//                           <i>
//                             физическим лицом
//                             <br />
//                           </i>
//                           <i>
//                             &nbsp;**при согласовании объекта <br />
//                           </i>
//                           <i>
//                             размером более 30 гектаров, <br />
//                           </i>
//                           <i>
//                             стоимость рассчитывается <br />
//                           </i>
//                           <i>
//                             исходя из фактически <br />
//                           </i>
//                           <i>
//                             понесенных затрат. <br />
//                           </i>
//                           <i>
//                             В случае отсутствия <br />
//                           </i>
//                           <i>
//                             объектов электросетевого <br />
//                           </i>
//                           <i>
//                             хозяйства принадлежащих
//                             <br />
//                           </i>
//                           <i>
//                             &nbsp;АО&nbsp;«Мособлэнерго»,
//                             <br />
//                           </i>
//                           <i>
//                             &nbsp;на&nbsp;рассматриваемом объекте, <br />
//                           </i>
//                           <i>
//                             оплата взымается <br />
//                           </i>
//                           <i>только за первый гектар.</i>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Для физических лиц
//                         </td>
//                         <td rowSpan="2" style={{ textAlign: "center" }}>
//                           3 900,00
//                         </td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <br />1 объект
//                         </td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           Для юридических лиц
//                         </td>
//                         <td rowSpan="2" style={{ textAlign: "center" }}>
//                           5 000,00 + 3 000,00
//                         </td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           до 1 Га + *за каждый последующий
//                         </td>
//                       </tr>
//                       <tr>
//                         <td rowSpan="3" style={{ textAlign: "center" }}>
//                           <nobr>06-11</nobr>
//                         </td>
//                         <td rowSpan="3" style={{ textAlign: "center" }}>
//                           Рассмотрение для согласования <br />
//                           рабочей и/или проектной документации
//                           <br />
//                           по строительству и/или переустройству <br />
//                           инженерных коммуникаций, <br />
//                           линий электропередачи и связи, <br />
//                           трубопроводов, зданий, автомобильных, <br />
//                           железных дорог и прочих инженерных сооружений.
//                           <br />
//                           &nbsp;*но не более 100 тыс. рублей (с НДС)
//                           <br />
//                           **под точечным объектом понимается — 1 одна опора,{" "}
//                           <br />1 щит, 1 шлагбаум и т.п.
//                           <br />
//                           ***услуга оказывается по указанной цене при условии
//                           предоставления физическим лицом документов,
//                           подтверждающих право собственности на земельный
//                           участок
//                         </td>
//                         <td rowSpan="2" style={{ textAlign: "center" }}>
//                           Для юридических лиц
//                           <br />
//                           &nbsp;
//                           <br />
//                           за каждый том (согласование)
//                           <br />
//                           <br />
//                           &nbsp;согласно ГОСТ Р <nobr>21.1.1101-2013</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           *20 000,00 за не точечный объект
//                         </td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           4 000,00 **за точечный объект
//                         </td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           {" "}
//                           Для физических лиц
//                           <p align="center">
//                             <br />
//                           </p>
//                           <p align="center">
//                             <br />
//                           </p>
//                         </td>
//                         <td style={{ textAlign: "center" }}>***4 000,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-12</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Оформление акта согласования технологической и(или)
//                           аварийной брони электроснабжения потребителя
//                           электрической энергии (мощности)
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 объект</td>
//                         <td style={{ textAlign: "center" }}>15 000,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-13</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Подготовка и направление <br />в адрес органа
//                           федерального <br />
//                           государственного энергетического <br />
//                           надзора (Ростехнадзора) <br />
//                           уведомления о готовности <br />
//                           на ввод в эксплуатацию объектов <br />
//                           (по поручению заявителя в соответствии
//                           <br />с пунктом 18(1) Правил технологического <br />
//                           присоединения энергопринимающих <br />
//                           устройств утвержденных <br />
//                           ППРФ № 861 от 27.12.2004г.)
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 шт.</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-14</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Уменьшение сроков подготовки документации до 3 рабочих
//                           дней (за исключением п.06-12, <nobr>06-13,</nobr>{" "}
//                           <nobr>06-15)</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 шт.</td>
//                         <td style={{ textAlign: "center" }}>двойная цена</td>
//                       </tr>

//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-15</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Восстановление и переоформление документов о
//                           технологическом присоединении
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 объект</td>
//                         <td style={{ textAlign: "center" }}>1&nbsp;000,00</td>
//                       </tr>

//                       <tr>
//                         <td rowSpan="5" style={{ textAlign: "center" }}>
//                           <nobr>06-16</nobr>
//                         </td>
//                         <td rowSpan="5" style={{ textAlign: "center" }}>
//                           Подготовка комплекта документов, подтверждающих
//                           технологическое присоединение к электросетевым
//                           объектам сторонних лиц (акт разграничения балансовой
//                           принадлежности электросетей, акт допуска в
//                           эксплуатацию прибора учета электрической энергии)
//                         </td>
//                         <td rowSpan="5" style={{ textAlign: "center" }}>
//                           Комплект документов
//                         </td>
//                         <td>
//                           {" "}
//                           Для лиц, относящихся к многодетным, малоимущим,
//                           ветеранам, инвалидам, подвергшимся воздействию
//                           радиации вследствие катастрофы на Чернобыльской АЭС{" "}
//                           <br />4 981,32
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           Максимальная присоединенная мощность до 15 кВт
//                           <br />
//                           24 000,00
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           Максимальная присоединенная мощность от 15 кВт до 150
//                           кВт
//                           <br />
//                           38 000,00
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           Максимальная присоединенная мощность от 150 кВт до 670
//                           кВт
//                           <br />
//                           79 000,00
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           Максимальная присоединенная мощность свыше 670 кВт
//                           <br />
//                           159 000,00
//                         </td>
//                       </tr>

//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-17</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Согласование и выверка схемы актов границ
//                           опосредованного присоединения
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Комплект документов
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 350,00</td>
//                       </tr>

//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-18</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Подготовка предварительных технических условий на
//                           технологическое присоединение
//                         </td>
//                         <td style={{ textAlign: "center" }}>ТУ</td>
//                         <td style={{ textAlign: "center" }}>6 094,22</td>
//                       </tr>

//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-19</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Повторное рассмотрение документации по услуге 06-11
//                           при условии устранения замечаний в срок, не
//                           превышающий 90 дней*
//                           <br />
//                           &nbsp;
//                           <i>
//                             * Конечным результатом рассмотрения документации
//                             является ее согласование при условии отсутствия
//                             обоснованных замечаний или выставление обоснованных
//                             замечаний при их наличии.
//                             <br />
//                           </i>
//                           <i>
//                             Замечания по результатам рассмотрения документации
//                             выдаются единовременно. При повторном рассмотрении
//                             документации производится проверка устранения ранее
//                             выданных замечаний и проверка на возможное
//                             возникновение новых замечаний вследствие
//                             корректировки проектной документации заказчиком
//                             <br />
//                           </i>
//                           <i>
//                             В случае предоставления документации на повторное
//                             рассмотрение в срок, превышающий 90 дней, взимается
//                             полная стоимость услуги.
//                           </i>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           за каждый том (согласование)
//                         </td>
//                         <td style={{ textAlign: "center" }}>50% цены услуги</td>
//                       </tr>

//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>06-20</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Прочие консультационные услуги
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 объект</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 7. Транспортные услуги
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_yuridicheskogo_licza_543ad332e0.doc?updated_at=2023-08-30T11:03:18.346Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Forma_zayavki_dlya_individualnyh_predprinimatelej_78e37b533f.doc?updated_at=2023-08-30T11:03:18.164Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_fizicheskih_licz_b8172f82b0.doc?updated_at=2023-08-30T11:03:18.356Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>а
//                 <p>
//                   {" "}
//                   Аренда специализированной техники — отличное решение для
//                   компаний, не имеющих собственной техники. Данное решение
//                   позволяет значительно сэкономить средства тем, кому необходима
//                   специализированная техника для строительно-монтажных или
//                   ремонтных работ, избавляя клиентов от необходимости покупки,
//                   ремонта и обслуживания собственного транспорта.
//                 </p>
//                 <p>
//                   {" "}
//                   <strong>
//                     АО «Мособлэнерго» оказывает транспортные услуги в Московской
//                     области и предлагает при проведении строительно-монтажных
//                     работ воспользоваться своими средствами механизации. Парк
//                     техники компании представлен более 1500 единицами наиболее
//                     востребованных образцов машин и механизмов различной
//                     грузоподъемности и функциональности:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p>
//                       {" "}
//                       спецтехника для выполнения различных строительных и
//                       ремонтных работ;
//                     </p>
//                   </li>
//                   <li>
//                     <p> землеройная техника различной модификации;</p>
//                   </li>
//                   <li>
//                     <p> погрузочно-разгрузочные механизмы;</p>
//                   </li>
//                   <li>
//                     <p> передвижная лаборатория.</p>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   Все автомобили, в том числе и специализированные, своевременно
//                   проходят ТО и управляются квалифицированным персоналом.
//                 </p>
//                 <p>
//                   {" "}
//                   Также АО «Мособлэнерго» предлагает услуги по предоставлению в
//                   аренду автономных источников электроснабжения (передвижных
//                   электростанций) мощностью до 650 кВа, с предоставлением
//                   дежурного персонала (за дополнительную плату).
//                 </p>
//                 <p>
//                   {" "}
//                   Нередко потребитель, впервые столкнувшись с проблемой
//                   отключения электроэнергии на короткий или длительный срок,
//                   может принять поспешное решение о приобретении дизельного
//                   генератора. Это не всегда оправдано, так как покупка такого
//                   дорогого оборудования, как правило, не окупается, а
//                   использование услуги аренды генератора будет верным и гораздо
//                   более экономичным решением. Если Вы сомневаетесь в мощности
//                   генератора, который необходим, Вам помогут наши специалисты.
//                 </p>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table align="center">
//                     <colgroup>
//                       <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <th style={{ textAlign: "center" }}>Код</th>
//                         <th style={{ textAlign: "center" }}>
//                           Наименование услуги
//                         </th>
//                         <th style={{ textAlign: "center" }}>
//                           <strong>Ед. измерения</strong>
//                         </th>
//                         <th style={{ textAlign: "center" }}>
//                           Цена, руб. с НДС
//                         </th>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-01</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Услуги передвижной электротехнической лаборатории на
//                           базе автомобиля с персоналом
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>4 000,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-02</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>Автобуровая</td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>3 700,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-03</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Автокран, до 6 т
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>2 900,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-04</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Автокран, от 6 до 16 т
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>2 900,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-05</nobr>
//                         </td>
//                         <td>Автокран, от 16 до 25 т</td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>2 900,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-06</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Автомобили бортовые, грузоподъемность до 5 т
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>3 200,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-07</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>Самосвал</td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>2 600,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-08</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Бригада для работы на автоподъёмнике
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>1 500,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-09</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Автомобиль бортовой с краном-манипулятором
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>3 000,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-10</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Автоподъемник (длина стрелы 18 м)
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>1 800,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-11</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Автоподъемник (длина стрелы 22 м)
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>2 600,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-12</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>Манипулятор</td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>2 400,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-13</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Работы ответственного за безопасное производство с
//                           грузоподъемным механизмом
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>850,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-14</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Работы по строповке и увязке грузов
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>650,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-15</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Экскаватор 0,8 м.куб
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>2 100,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-16</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Экскаватор-погрузчик 0,25 м.куб
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>1 700,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-17</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Экскаватор с ковшом-дробилкой
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>4 802,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-18</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Автомобиль грузовой, длинномер
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>3 027,00</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4" style={{ textAlign: "center" }}>
//                           <strong>
//                             Предоставление автономных источников
//                             электроснабжения (передвижных электростанций) без
//                             дежурного персонала:
//                           </strong>
//                           <strong>(</strong>
//                           <strong>минимальное время аренды — 8 часов</strong>
//                           <strong>)</strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-19</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>До 400 кВт</td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>4 300,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-20</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           От 400 кВт до 1000 кВт
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>6 800,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-21</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>1000 кВт</td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>9&nbsp;640,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-22</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Предоставление дежурного персонала для передвижных
//                           источников электроснабжения
//                         </td>
//                         <td style={{ textAlign: "center" }}>час</td>
//                         <td style={{ textAlign: "center" }}>1 800,00</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4" style={{ textAlign: "center" }}>
//                           <strong>
//                             Предоставление комплектной трансформаторной
//                             подстанции (КТП) с доставкой на объект без дежурного
//                             персонала:
//                           </strong>
//                           <strong>(минимальный срок аренды - 1 месяц)</strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-23</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>КТП 63 кВА</td>
//                         <td style={{ textAlign: "center" }}>месяц</td>
//                         <td style={{ textAlign: "center" }}>31 375,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-24</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>КТП 100 кВА</td>
//                         <td style={{ textAlign: "center" }}>месяц</td>
//                         <td style={{ textAlign: "center" }}>33 875,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-25</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>КТП 160 кВА</td>
//                         <td style={{ textAlign: "center" }}>месяц</td>
//                         <td style={{ textAlign: "center" }}>36 375,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-26</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>КТП 250 кВА</td>
//                         <td style={{ textAlign: "center" }}>месяц</td>
//                         <td style={{ textAlign: "center" }}>39 500,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-27</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>КТП 400 кВА</td>
//                         <td style={{ textAlign: "center" }}>месяц</td>
//                         <td style={{ textAlign: "center" }}>45 125,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>07-28</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>КТП 630 кВА</td>
//                         <td style={{ textAlign: "center" }}>месяц</td>
//                         <td style={{ textAlign: "center" }}>50 125,00</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 8. Организация учёта электроэнергии, энергоаудит
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_yuridicheskogo_licza_543ad332e0.doc?updated_at=2023-08-30T11:03:18.346Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Forma_zayavki_dlya_individualnyh_predprinimatelej_78e37b533f.doc?updated_at=2023-08-30T11:03:18.164Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_fizicheskih_licz_b8172f82b0.doc?updated_at=2023-08-30T11:03:18.356Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   Одной из самых актуальных задач для любого промышленного
//                   предприятия сегодня является эффективное энергоснабжение и
//                   энергосбережение, которое позволяет поддерживать
//                   конкурентоспособность в условиях постоянного роста стоимости
//                   энергоресурсов. Реализовать меры эффективного энергосбережения
//                   невозможно, если на предприятии не обеспечивается точный учет
//                   потребления электроэнергии. Важнейшим шагом на этом пути
//                   станет создание АИИСКУЭ.
//                 </p>
//                 <p>
//                   {" "}
//                   <strong>АИИСКУЭ</strong> — автоматизированная
//                   информационно-измерительная система коммерческого учёта
//                   электроэнергии, которая обеспечивает дистанционный сбор
//                   информации с интеллектуальных приборов учета, передачу этой
//                   информации на верхний уровень с последующей ее обработкой.
//                   Создание АИИСКУЭ позволяет автоматизировать учет и добиться
//                   его максимальной точности.{" "}
//                 </p>
//                 <p>
//                   {" "}
//                   <strong>
//                     Автоматизированные информационно-измерительные системы
//                     коммерческого учёта электроэнергии выполняют ряд основных
//                     функций:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p>
//                       {" "}
//                       непрерывный автоматический сбор данных с приборов учета и
//                       их отправка на сервер;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       постоянное накопление и хранение данных за прошлые
//                       периоды;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       анализ информации об энергопотреблении на предприятии,
//                       позволяющий обеспечить его оптимизацию;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       выявление несанкционированных подключений к сети
//                       энергоснабжения на предприятии;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       удаленное подключение и отключение от сети конечных
//                       потребителей.
//                     </p>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   АО «Мособлэнерго» предоставляет услугу по выполнению силами
//                   своих специалистов мероприятий по проектированию систем учета
//                   электроэнергии, установке и обслуживанию комплекса АИИСКУЭ,
//                   снятию показаний с приборов учета, а также оценке режима
//                   потребления электроэнергии.
//                 </p>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table>
//                     <colgroup>
//                       <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <th style={{ textAlign: "center" }}>Код</th>
//                         <th style={{ textAlign: "center" }}>
//                           Наименование услуги
//                         </th>
//                         <th style={{ textAlign: "center" }}>Ед. измерения</th>
//                         <th style={{ textAlign: "center" }}>
//                           Цена, руб. с НДС
//                         </th>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>08-01</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Проектирование систем учёта электроэнергии
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 объект</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>08-02</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Установка и обслуживание комплекса АИИС КУЭ
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 объект</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>08-03</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Энергоаудит сетей потребителей
//                           <br />
//                           (проверка цепей учета, снятие <br />и передача
//                           потребителю профиля мощности, <br />
//                           составление баланса электрической энергии <br />и
//                           мощности, тепловизионный контроль,
//                           <br />
//                           выявление безучетного потребления)
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 объект</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>08-04</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Снятие почасовых показаний <br />у Заказчика
//                           <br />
//                           (для потребителей с максимальной мощностью <br />
//                           свыше 670кВт <br />
//                           при наличии технической возможности
//                         </td>
//                         <td style={{ textAlign: "center" }}>1 объект</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>08-05</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Оценка режима потребления клиента <br />с целью
//                           определения <br />
//                           прогнозируемого роста стоимости услуг <br />
//                           по передаче электрической энергии <br />
//                           для потребителей группы «прочие потребители» <br />в
//                           части оплаты максимальной
//                           <br />
//                           резервируемой мощности <br />
//                           (на основании данных об объёмах <br />
//                           потребления и имеющейся документации <br />о
//                           технологическом присоединении, <br />
//                           без выезда на объект клиента)
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           1 объект (24 раб. часа)
//                         </td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 9. Ремонт, проверка, калибровка, техобслуживание,
//                 программирование приборов учёта
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_yuridicheskogo_licza_543ad332e0.doc?updated_at=2023-08-30T11:03:18.346Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Forma_zayavki_dlya_individualnyh_predprinimatelej_78e37b533f.doc?updated_at=2023-08-30T11:03:18.164Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_fizicheskih_licz_b8172f82b0.doc?updated_at=2023-08-30T11:03:18.356Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   Качество выполнения электромонтажных работ в цепях
//                   электрического учета и их грамотная эксплуатация являются
//                   одним ключевых факторов, от которых зависит бесперебойная
//                   работа электрической сети на Вашем объекте, и её безопасность
//                 </p>
//                 <p>
//                   {" "}
//                   АО «Мособлэнерго» предоставляет широкий спектр услуг по
//                   выполнению работ, связанных с установкой/заменой приборов
//                   учёта электрической энергии, трансформаторов тока, их
//                   калибровку, поверку и обслуживание.
//                 </p>
//                 <p>
//                   {" "}
//                   <strong>
//                     Доверив выполнение работ нашим специалистам, Вы можете быть
//                     уверены, что учёт электрической энергии и обслуживание
//                     систем учета осуществляется должным образом.
//                   </strong>
//                 </p>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table>
//                     <colgroup>
//                       <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <th style={{ textAlign: "center" }}>Код</th>
//                         <th style={{ textAlign: "center" }}>
//                           Наименование услуги
//                         </th>
//                         <th style={{ textAlign: "center" }}>Ед. измерения</th>
//                         <th style={{ textAlign: "center" }}>
//                           Цена, руб. с НДС
//                         </th>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Снятие и передача показаний прибора учета с выездом:
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-01</nobr>
//                         </td>
//                         <td>
//                           Бытовой сектор, многоэтажные дома, <nobr>1-й</nobr>{" "}
//                           электросчетчик
//                         </td>
//                         <td>1 шт.</td>
//                         <td>от 1 450</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-02</nobr>
//                         </td>
//                         <td>
//                           Бытовой сектор, многоэтажные дома, начиная со{" "}
//                           <nobr>2-го</nobr> электросчетчика
//                         </td>
//                         <td>1 шт.</td>
//                         <td>65,00</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Снятие и передача показаний прибора учета с выездом:
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-03</nobr>
//                         </td>
//                         <td>
//                           Бытовой сектор, одноэтажные дома, индивидуальные
//                           домовладения
//                         </td>
//                         <td>1 шт.</td>
//                         <td>от 700</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Снятие и передача профиля мощности прибора учета с
//                             выездом:
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-04</nobr>
//                         </td>
//                         <td>
//                           Бытовой сектор, многоэтажные дома, 1 -й электросчетчик
//                         </td>
//                         <td>1 шт.</td>
//                         <td>от 750</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-05</nobr>
//                         </td>
//                         <td>
//                           Бытовой сектор, многоэтажные дома, начиная со{" "}
//                           <nobr>2-го</nobr> электросчетчика
//                         </td>
//                         <td>1 шт.</td>
//                         <td>130,00</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           Снятие и передача профиля мощности прибора учета с
//                           выездом:
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-06</nobr>
//                         </td>
//                         <td>
//                           Бытовой сектор, одноэтажные дома, индивидуальные
//                           домовладения
//                         </td>
//                         <td>1 шт.</td>
//                         <td>от 650</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Проверка схемы подключения электросчетчика:
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-07</nobr>
//                         </td>
//                         <td>
//                           <nobr>1-фазного</nobr>
//                         </td>
//                         <td>1 шт.</td>
//                         <td>5 000,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-08</nobr>
//                         </td>
//                         <td>
//                           <nobr>3-фазного</nobr> прямого включения
//                         </td>
//                         <td>1 шт.</td>
//                         <td>5 000,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-09</nobr>
//                         </td>
//                         <td>
//                           <nobr>3-фазного</nobr> трансформаторного включения
//                         </td>
//                         <td>1 шт.</td>
//                         <td>5 000,00</td>
//                       </tr>

//                       <tr>
//                         <td>
//                           <nobr>09-10</nobr>
//                         </td>
//                         <td>
//                           Проверка схемы подключения
//                           <br />
//                           &nbsp;электросчетчика 6/10 кВ <br />с ТН и ТТ
//                         </td>
//                         <td>1 шт.</td>
//                         <td>индивидуально</td>
//                       </tr>

//                       <tr>
//                         <td colSpan="4">
//                           <strong>Программирование электросчетчика:</strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-11</nobr>
//                         </td>
//                         <td>С выездом</td>
//                         <td>1 шт.</td>
//                         <td>от 1 450</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-12</nobr>
//                         </td>
//                         <td>Без выезда</td>
//                         <td>1 шт.</td>
//                         <td>от 780</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Настройка и программирование точки учета в базе
//                             клиента:
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-13</nobr>
//                         </td>
//                         <td>С выездом</td>
//                         <td>1 шт.</td>
//                         <td>от 1600</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-14</nobr>
//                         </td>
//                         <td>Без выезда</td>
//                         <td>1 шт.</td>
//                         <td>от 900</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Годовое техническое обслуживание прибора учета в
//                             электроустановках до 1000 В:
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-15</nobr>
//                         </td>
//                         <td>Ежеквартальное ТО</td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-16</nobr>
//                         </td>
//                         <td>
//                           Замена оборудования по выявленным неисправностям
//                         </td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Годовое техническое обслуживание прибора учета в
//                             электроустановках <nobr>6-10 кВ:</nobr>
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-17</nobr>
//                         </td>
//                         <td>Ежеквартальное ТО</td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>09-18</nobr>
//                         </td>
//                         <td>
//                           Замена оборудования по выявленным неисправностям
//                         </td>
//                         <td>объект</td>
//                         <td>индивидуально</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 10. Установка комплекса АИИС КУЭ
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_yuridicheskogo_licza_543ad332e0.doc?updated_at=2023-08-30T11:03:18.346Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Forma_zayavki_dlya_individualnyh_predprinimatelej_78e37b533f.doc?updated_at=2023-08-30T11:03:18.164Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_fizicheskih_licz_b8172f82b0.doc?updated_at=2023-08-30T11:03:18.356Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   Перечень услуг нашей компании включает проектирование,
//                   установку, запуск и обслуживание АИИСКУЭ. Благодаря нашей
//                   работе многие компании и производственные объекты Подмосковья
//                   получили современное оборудование для учета расходов
//                   электроэнергии и возможность контролировать потребление
//                   энергоресурсов.
//                 </p>
//                 <p>
//                   {" "}
//                   <strong>
//                     Для каждого клиента специалисты нашей компании подбирают
//                     проектные решения с учетом особенностей, технических
//                     характеристик, поставленных заказчиком задач и целей.
//                     Установленное оборудование эффективно взаимодействует с
//                     программным обеспечением и техническим оснащением объектов.{" "}
//                   </strong>
//                 </p>
//                 <p>
//                   {" "}
//                   Комплектацию шкафов наши специалисты разрабатывают согласно
//                   потребностям клиента, в некоторых имеется возможность
//                   применять типовые модели. Этот вариант актуален, когда
//                   оборудование учета не требует сложных функциональных свойств.{" "}
//                 </p>
//                 <p>
//                   {" "}
//                   Заказчикам, которые уже используют системы учета энергии, АО
//                   «Мособлэнерго» предлагает высококвалифицированный сервис и
//                   обслуживание АИИСКУЭ. Согласно законодательным нормам,
//                   регулярное обслуживание системы является обязательным
//                   условием. Оно включает проверку функциональности установленной
//                   периодичностью, диагностику приборов учета, восстановление
//                   вышедших из строя сегментов и устройств.
//                 </p>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table>
//                     <colgroup>
//                       <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <th style={{ textAlign: "center" }}>Код</th>
//                         <th style={{ textAlign: "center" }}>
//                           Наименование услуги
//                         </th>
//                         <th style={{ textAlign: "center" }}>Ед. измерения</th>
//                         <th style={{ textAlign: "center" }}>
//                           Цена, руб. с НДС
//                         </th>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-01</nobr>
//                         </td>
//                         <td>
//                           Разработка проектно-сметной документации на
//                           Автоматизированную информационно-измерительную систему
//                           коммерческого учета электроэнергии (АИИС КУЭ) с
//                           количеством узлов учета до 5
//                         </td>
//                         <td>1 шт.</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-02</nobr>
//                         </td>
//                         <td>Установка шкафа автоматизации</td>
//                         <td>1 шт.</td>
//                         <td>6 500,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-03</nobr>
//                         </td>
//                         <td>Установка модема</td>
//                         <td>1 шт.</td>
//                         <td>4 500,00</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Снятие и передача показаний прибора учета без
//                             выезда:
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-04</nobr>
//                         </td>
//                         <td>
//                           Бытовой сектор и юридические лица, <nobr>1-й</nobr>{" "}
//                           электросчетчик в АИИС КУЭ
//                         </td>
//                         <td>1 шт.</td>
//                         <td>от 230</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-05</nobr>
//                         </td>
//                         <td>
//                           Бытовой сектор и юридические лица, начиная со{" "}
//                           <nobr>2-го</nobr> электросчетчика в АИИС КУЭ
//                         </td>
//                         <td>1 шт.</td>
//                         <td>от 60</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Снятие и передача показаний прибора учета с выездом:
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-06</nobr>
//                         </td>
//                         <td>
//                           Юридические лица, <nobr>1-й</nobr> электросчетчик в
//                           АИИС КУЭ
//                         </td>
//                         <td>1 шт.</td>
//                         <td>2 000,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-07</nobr>
//                         </td>
//                         <td>
//                           Юридические лица, начиная со <nobr>2-го</nobr>{" "}
//                           электросчетчика в АИИС КУЭ
//                         </td>
//                         <td>1 шт.</td>
//                         <td>650,00</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Снятие и передача профиля мощности прибора учета без
//                             выезда:
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <span style={{ whiteSpace: "nowrap" }}>10-08</span>
//                         </td>
//                         <td>
//                           Бытовой сектор и юридические лица, <nobr>1-й</nobr>{" "}
//                           электросчетчик в АИИС КУЭ
//                         </td>
//                         <td>1 шт.</td>
//                         <td>от 460</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-09</nobr>
//                         </td>
//                         <td>
//                           Бытовой сектор и юридические лица, начиная со{" "}
//                           <nobr>2-го</nobr> электросчетчика в АИИС КУЭ
//                         </td>
//                         <td>1 шт.</td>
//                         <td>от 300</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Снятие и передача профиля мощности прибора учета с
//                             выездом:
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-10</nobr>
//                         </td>
//                         <td>
//                           Юридические лица, <nobr>1-й</nobr> электросчетчик в
//                           АИИС КУЭ
//                         </td>
//                         <td>1 шт.</td>
//                         <td>от 1 500</td>
//                       </tr>
//                       <tr>
//                         <td>10-11</td>
//                         <td>
//                           Юридические лица, начиная со <nobr>2-го</nobr>{" "}
//                           электросчетчика в АИИС КУЭ
//                         </td>
//                         <td>1 шт.</td>
//                         <td>от 370</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Настройка автоматизированной информационно —
//                             измерительной системы:
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-12</nobr>
//                         </td>
//                         <td>С количеством приборов учета 2</td>
//                         <td>1 шт.</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <span style={{ whiteSpace: "nowrap" }}>10-13</span>
//                         </td>
//                         <td>С количеством приборов учета свыше 2 до 50</td>
//                         <td>1 шт.</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-14</nobr>
//                         </td>
//                         <td>С количеством приборов учета свыше 50 до 100</td>
//                         <td>1 шт.</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <span style={{ whiteSpace: "nowrap" }}>10-15</span>
//                         </td>
//                         <td>С количеством приборов учета свыше 100 до 200</td>
//                         <td>1 шт.</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>
//                             Годовое техническое обслуживание средств
//                             автоматизации учета электроэнергии (АИИС КУЭ):
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <span style={{ whiteSpace: "nowrap" }}>10-16</span>
//                         </td>
//                         <td>До 25 приборов учета</td>
//                         <td>1 шт.</td>
//                         <td>16 600,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-17</nobr>
//                         </td>
//                         <td>От 26 до 50 приборов учета</td>
//                         <td>1 шт.</td>
//                         <td>25 700,00</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>Аудит системы АИИС КУЭ:</strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-18</nobr>
//                         </td>
//                         <td>До 25 приборов учета</td>
//                         <td>1 шт.</td>
//                         <td>7 250,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <span style={{ whiteSpace: "nowrap" }}>10-19</span>
//                         </td>
//                         <td>от 26 до 50 приборов учета</td>
//                         <td>1 шт.</td>
//                         <td>12 400,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-20</nobr>
//                         </td>
//                         <td>
//                           Настройка и программирование точки учета в базе
//                           клиента (с выездом)
//                         </td>
//                         <td>1 шт.</td>
//                         <td>3 300,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>10-21</nobr>
//                         </td>
//                         <td>
//                           Настройка и программирование точки учета в базе
//                           клиента (без выезда)
//                         </td>
//                         <td>1 шт.</td>
//                         <td>1 400,00</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4">
//                           <strong>Дополнительное оборудование:</strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <span style={{ whiteSpace: "nowrap" }}>10-22</span>
//                         </td>
//                         <td>
//                           Настройка и программирование удаленного дисплея к
//                           прибору учета электрической энергии
//                         </td>
//                         <td>1 шт.</td>
//                         <td>1 450,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <span style={{ whiteSpace: "nowrap" }}>10-23</span>
//                         </td>
//                         <td>
//                           Удаленный дисплей для приборов учета электрической
//                           энергии
//                           <br />
//                           Цена за услугу включает в себя стоимость удаленного
//                           дисплея включает в себя стоимость самого дисплея, а
//                           также работу по его настройке и программированию.
//                           Услуга оказывается при негарантийных случаях выхода
//                           дисплея из строя, а также при его утере.
//                         </td>
//                         <td>1 шт.</td>
//                         <td>от 4200</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 11. Монтаж и обслуживание сетей наружного освещения
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_yuridicheskogo_licza_543ad332e0.doc?updated_at=2023-08-30T11:03:18.346Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/Forma_zayavki_dlya_individualnyh_predprinimatelej_78e37b533f.doc?updated_at=2023-08-30T11:03:18.164Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_dlya_fizicheskih_licz_b8172f82b0.doc?updated_at=2023-08-30T11:03:18.356Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   Различные осветительные устройства на протяжении многих
//                   десятилетий используются для наружного освещения промышленных
//                   и уличных территорий. Сейчас невозможно представить
//                   современные улицы и объекты без освещения в темное время
//                   суток.
//                 </p>
//                 <p>
//                   {" "}
//                   <strong>
//                     С помощью сетей наружного освещения решаются несколько
//                     задач:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p> безопасность;</p>
//                   </li>
//                   <li>
//                     <p> удобство передвижения в темное время суток;</p>
//                   </li>
//                   <li>
//                     <p> эстетическая составляющая.</p>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   АО «Мособлэнерго» предоставляет услуги по проектированию и
//                   оперативно-техническому обслуживанию сетей наружного
//                   освещения, систем освещения городов, промышленных предприятий,
//                   садоводческих товариществ, въездных групп частных
//                   домовладений.{" "}
//                 </p>
//                 <p>
//                   {" "}
//                   Специалисты компании имеют большой практический опыт, и
//                   предлагают своим клиентам конкурентные цены для достижения
//                   высокого качества при экономии затрат. Используются
//                   современные и энергосберегающие технологии, которые позволяют
//                   эксплуатировать сети наружного освещения в различных
//                   температурных диапазонах (от — 40°C до + 40°С), достигать
//                   лучших показателей освещенности и сокращать потребление
//                   энергии. Клиентам предоставляются лучшие решения по
//                   организации уличного освещения, предусматривающие высокое
//                   качество и оптимальные сроки выполняемых работ.
//                 </p>
//                 <p>
//                   {" "}
//                   Профессиональное обслуживание сетей уличного освещения
//                   выполняется посредством специальной техники и бригады
//                   обученных электромонтёров. Все работники имеют допуск к
//                   высотным работам и используют испытанное измерительное
//                   оборудование и средства защиты.
//                 </p>
//                 <p>
//                   {" "}
//                   <strong>
//                     Доверив обслуживание сетей наружного освещения нашим
//                     специалистам, Вы можете быть уверены в их исправной работе и
//                     безопасности для окружающих людей.
//                   </strong>
//                 </p>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table>
//                     <colgroup>
//                       <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <th style={{ textAlign: "center" }}>Код</th>
//                         <th style={{ textAlign: "center" }}>
//                           Наименование услуги
//                         </th>
//                         <th style={{ textAlign: "center" }}>Ед. измерения</th>
//                         <th style={{ textAlign: "center" }}>
//                           Цена, руб. с НДС
//                         </th>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-01</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Монтаж и обслуживание сетей наружного освещения
//                         </td>
//                         <td style={{ textAlign: "center" }}>объект</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td colSpan="4" style={{ textAlign: "center" }}>
//                           <strong>
//                             Единичные расценки по уличному освещению (в том
//                             числе материал):
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-02</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Осмотр пунктов питания и оборудования управления
//                           наружным освещением
//                         </td>
//                         <td style={{ textAlign: "center" }}>чел/ч</td>
//                         <td style={{ textAlign: "center" }}>1 600,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-03</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Замена контроллера (без учета материалов)
//                         </td>
//                         <td style={{ textAlign: "center" }}>шт.</td>
//                         <td style={{ textAlign: "center" }}>7 450,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-04</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Замена светового реле
//                         </td>
//                         <td style={{ textAlign: "center" }}>шт.</td>
//                         <td style={{ textAlign: "center" }}>3 500,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-05</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Капитальный ремонт оборудования в шкафах уличного
//                           освещения напряжением 0,4 кВ на трансформаторных
//                           подстанциях
//                         </td>
//                         <td style={{ textAlign: "center" }}>чел/ч</td>
//                         <td style={{ textAlign: "center" }}>2 450,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-06</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Осмотр трасс ВЛ <nobr>0,22-0,4 кВ</nobr> уличного
//                           освещения на предмет целостности и рабочего состояния
//                           осветительных приборов
//                         </td>
//                         <td style={{ textAlign: "center" }}>км.</td>
//                         <td style={{ textAlign: "center" }}>1 800,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-07</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Измерение сопротивления заземляющего устройства
//                           корпуса светильника уличного освещения
//                         </td>
//                         <td style={{ textAlign: "center" }}>измерение</td>
//                         <td style={{ textAlign: "center" }}>4 950,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-08</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Монтаж светильника уличного освещения на
//                           железобетонной или деревянной опоре ВЛ-0,4 кВ (без
//                           учета материалов)
//                         </td>
//                         <td style={{ textAlign: "center" }}>шт.</td>
//                         <td style={{ textAlign: "center" }}>от 3300</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-09</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Замена ламп в светильниках уличного освещения (без
//                           учета материалов)
//                         </td>
//                         <td style={{ textAlign: "center" }}>шт.</td>
//                         <td style={{ textAlign: "center" }}>800,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-10</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Замена светильника уличного освещения на опоре 0,4 кВ
//                           с применением ГПМ
//                         </td>
//                         <td style={{ textAlign: "center" }}>шт.</td>
//                         <td style={{ textAlign: "center" }}>8 000,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-11</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Замена светильника уличного освещения на опоре 0,4 кВ
//                         </td>
//                         <td style={{ textAlign: "center" }}>шт.</td>
//                         <td style={{ textAlign: "center" }}>7 000,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-12</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Ремонт светильника уличного освещения на опоре 0,4 кВ
//                         </td>
//                         <td style={{ textAlign: "center" }}>чел/ч</td>
//                         <td style={{ textAlign: "center" }}>2 500,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-13</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Чистка светильника
//                         </td>
//                         <td style={{ textAlign: "center" }}>чел/ч</td>
//                         <td style={{ textAlign: "center" }}>900,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-14</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Проведение замеров светотехнических параметров
//                           светильника
//                         </td>
//                         <td style={{ textAlign: "center" }}>чел/ч</td>
//                         <td style={{ textAlign: "center" }}>3 400,00</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-15</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Монтаж опор ВЛ -&nbsp;0,4 кВ, совмещенных со
//                           светильником уличного освещения
//                         </td>
//                         <td style={{ textAlign: "center" }}>шт.</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-16</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Монтаж провода СИП и провода питания светильников
//                           уличного освещения на опоры ВЛ-0,4 кВ
//                         </td>
//                         <td style={{ textAlign: "center" }}>км.</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-17</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Проектирование сетей освещения
//                         </td>
//                         <td style={{ textAlign: "center" }}>объект</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>11-18</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Монтаж автоматики сетей освещения в электроустановках
//                           до 1000 В
//                         </td>
//                         <td style={{ textAlign: "center" }}>объект</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 12. Подключение к электрическим сетям жилых домов и садовых
//                 участков. Комплексные решения
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <p></p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/zayavka_na_zaklyuchenie_dogovora_TP_6d4a5bbc57.docx?updated_at=2023-06-06T05:30:18.446Z`}
//                     >
//                       Форма заявки на оказание услуги
//                     </a>
//                   </li>
//                 </ul>
//                 <p></p>
//                 <p>
//                   {" "}
//                   <strong>
//                     Для тех, кому необходимо осуществить подключение своего дома
//                     или садового участка к сети электроснабжения, наша компания
//                     разработала специальные комплексные решения, которые
//                     значительно упростят и удешевят стоимость всех работ.
//                   </strong>
//                 </p>
//                 <p>
//                   {" "}
//                   <strong>
//                     АО «Мособлэнерго» предоставляет комплексные услуги по
//                     выполнению нашими специалистами мероприятий для подключения
//                     к электрическим сетям жилых домов и садовых участков. Услуга
//                     включает в себя:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p>
//                       {" "}
//                       проектирование и строительство трансформаторных
//                       подстанций, кабельных и воздушных линий электропередачи
//                       (ЛЭП);
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       сборка и монтаж узлов учета электрической энергии на
//                       опорах для возможности присоединения электрооборудования и
//                       электроинструмента на период строительства;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       технологическое присоединение энергопринимающих устройств
//                       (временных и постоянных строений) на территории земельного
//                       участка;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       монтаж ответвлений от магистральной ЛЭП до
//                       энергопринимающего устройства заявителя.
//                     </p>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   <strong>
//                     Использование услуг нашей компании будет иметь для Вас
//                     значительные преимущества:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p>
//                       {" "}
//                       отсутствие необходимости самостоятельного выполнения
//                       электромонтажных работ;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       качественно выполненные работы с использованием
//                       современных материалов;
//                     </p>
//                   </li>
//                   <li>
//                     <p> наиболее оптимальные технические решения;</p>
//                   </li>
//                   <li>
//                     <p> персональное обслуживание;</p>
//                   </li>
//                   <li>
//                     <p> проведение работ квалифицированными специалистами;</p>
//                   </li>
//                   <li>
//                     <p> гарантия на выполненные работы;</p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       экономия вашего времени, быстрое подключение к
//                       электрическим сетям.
//                     </p>
//                   </li>
//                 </ul>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table>
//                     <colgroup>
//                       <col /> <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <th style={{ textAlign: "center" }}>Код</th>
//                         <th style={{ textAlign: "center" }}>
//                           Наименование услуги
//                         </th>
//                         <th>Ед. измерения</th>
//                         <th style={{ textAlign: "center" }}>
//                           Цена, руб. с НДС
//                         </th>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-01</nobr>
//                         </td>
//                         <td>
//                           - Установка щита -&nbsp;1 шт.;
//                           <br />- Установка автоматического выключателя вводного
//                           -&nbsp;1шт.
//                           <br />- Подведение провода СИП (в воздушном
//                           исполнении) от объекта элнектроснабжения до
//                           присоединяемого объекта (не более 10 метров).
//                         </td>
//                         <td>Комплект «Начальный»</td>
//                         <td>
//                           Однофазный: 23 500,00
//                           <br />
//                           Трехфазный: 26 500,00
//                         </td>
//                       </tr>

//                       <tr>
//                         <td>
//                           <nobr>12-02</nobr>
//                         </td>
//                         <td>
//                           - Установка «трубостойки» -&nbsp;1 шт.;
//                           <br />- Установка щита учёта на «трубостойке» - 1 шт.;
//                           <br />- Установка автоматического выключателя вводного
//                           -&nbsp;1шт.
//                         </td>
//                         <td>Комплект «Базовый»</td>
//                         <td>
//                           Однофазный: 23 500,00
//                           <br />
//                           Трехфазный: 26 500,00
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-03</nobr>
//                         </td>
//                         <td>
//                           - Установка «трубостойки» -&nbsp;1 шт.;
//                           <br />- Установка щита учёта на «трубостойке» -&nbsp;1
//                           шт.;
//                           <br />- Установка автоматического выключателя вводного
//                           -&nbsp;1шт.;
//                           <br />- Установка автоматического выключателя{" "}
//                           <nobr>3-фазного -</nobr>&nbsp;1шт.;
//                           <br />- Установка автоматического выключателя{" "}
//                           <nobr>1-фазного -</nobr>&nbsp;1шт.;
//                           <br />- Установка розетки <nobr>1-фазной -</nobr>
//                           &nbsp;1шт.; <br />
//                           -&nbsp;Установка розетки <nobr>3-фазной -</nobr>
//                           &nbsp;1шт.
//                         </td>
//                         <td>Комплект «Базовый +»</td>
//                         <td>
//                           Однофазный: 29 500,00
//                           <br />
//                           Трехфазный: 31 500,00
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-04</nobr>
//                         </td>
//                         <td>
//                           - Установка «трубостойки» -&nbsp;1 шт.;
//                           <br />- Установка щита учёта на «трубостойке» -&nbsp;1
//                           шт.;
//                           <br />- Установка прибора учёта электрической энергии
//                           -&nbsp;1 шт.; <br />- Установка автоматических
//                           выключателей -&nbsp;2 шт.
//                         </td>
//                         <td>Комплект «Стандартный»</td>
//                         <td>
//                           Однофазный: 31 000,00
//                           <br />
//                           Трехфазный: 36 000,00
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-05</nobr>
//                         </td>
//                         <td>
//                           - Установка «трубостойки» -&nbsp;1 шт.;
//                           <br />- Установка щита учёта на «трубостойке» -&nbsp;1
//                           шт.;
//                           <br />- Установка прибора учёта электрической энергии
//                           -&nbsp;1 шт.; <br />- Установка автоматических
//                           выключателей -&nbsp;2 шт.;
//                           <br />- Монтаж устройства заземления «трубостойки»
//                           -&nbsp;1 шт.;
//                           <br />- Подведение провода СИП (в воздушном
//                           исполнении) от опоры до «трубостойки» -&nbsp;не более
//                           10 метров.
//                         </td>
//                         <td>Комплект «Расширенный»</td>
//                         <td>
//                           Однофазный: 45 000,00
//                           <br />
//                           Трехфазный: 53 000,00
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-06</nobr>
//                         </td>
//                         <td>
//                           - Установка прибора учёта электрической энергии (марки
//                           «РиМ» или «Матрица» с дистанционным дисплеем) на опоре
//                           ВЛ 0,4 кВ -&nbsp;1 шт.;
//                           <br />- Подведение провода СИП (в воздушном
//                           исполнении)от опоры до присоединяемого объекта (не
//                           более 25 метров).
//                         </td>
//                         <td>Комплект «Цифровой»</td>
//                         <td>
//                           Однофазный: индивидуально Трехфазный: индивидуально
//                         </td>
//                       </tr>
//                       <tr>
//                         <td colSpan="5">
//                           <strong>
//                             Дополнительные опции (без учета материалов)
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-07</nobr>
//                         </td>
//                         <td>Установка «трубостойки» высотой 7 метров</td>
//                         <td>шт.</td>
//                         <td colSpan="2">12 000,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-08</nobr>
//                         </td>
//                         <td>
//                           Установка дополнительной (промежуточной) «трубостойки»
//                         </td>
//                         <td>шт.</td>
//                         <td colSpan="2">12 000,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-09</nobr>
//                         </td>
//                         <td>Установка дополнительной железобетонной опоры</td>
//                         <td>шт.</td>
//                         <td colSpan="2">25&nbsp;000,00</td>
//                       </tr>

//                       <tr>
//                         <td>
//                           <nobr>12-10</nobr>
//                         </td>
//                         <td>
//                           Установка розетки <nobr>3-фазной</nobr>
//                         </td>
//                         <td>шт.</td>
//                         <td colSpan="2">1 200,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-11</nobr>
//                         </td>
//                         <td>
//                           Установка розетки <nobr>1-фазной</nobr>
//                         </td>
//                         <td>шт.</td>
//                         <td colSpan="2">700,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-12</nobr>
//                         </td>
//                         <td>
//                           Подведение кабеля в траншее под землей до объекта
//                         </td>
//                         <td>шт.</td>
//                         <td colSpan="2">индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-13</nobr>
//                         </td>
//                         <td>Прокладка провода по фасаду здания</td>
//                         <td>шт.</td>
//                         <td colSpan="2">индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-14</nobr>
//                         </td>
//                         <td>
//                           Установка светодиодного светильника (15 Вт), фотореле
//                           и автоматического выключателя (до 50 А) на
//                           «трубостойке»
//                         </td>
//                         <td>шт.</td>
//                         <td colSpan="2">10&nbsp;000,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-15</nobr>
//                         </td>
//                         <td>
//                           Установка светодиодного светильника (30 Вт), фотореле
//                           и автоматического выключателя (до 50 А) на
//                           «трубостойке»
//                         </td>
//                         <td>шт.</td>
//                         <td colSpan="2">11&nbsp;000,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-16</nobr>
//                         </td>
//                         <td>
//                           Монтаж контура заземления объекта (с учетом стоимости
//                           проведения замера сопротивления и составления
//                           соответствующего акта)
//                         </td>
//                         <td>шт.</td>
//                         <td colSpan="2">35&nbsp;500,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-17</nobr>
//                         </td>
//                         <td>Прокладка кабеля в земле</td>
//                         <td>1 м.</td>
//                         <td>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-18</nobr>
//                         </td>
//                         <td>Демонтаж кабеля</td>
//                         <td>1 м.</td>
//                         <td>160,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-19</nobr>
//                         </td>
//                         <td>
//                           Монтаж ввода 1-фазного в дом от опоры (натяжка провода
//                           СИП)
//                         </td>
//                         <td>1 м.</td>
//                         <td>620,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-20</nobr>
//                         </td>
//                         <td>
//                           Монтаж ввода 3-фазного от электросетевых объектов
//                           АО&nbsp;«Мособлэнерго» до потребителя (натяжка провода
//                           СИП)
//                         </td>
//                         <td>1 м.</td>
//                         <td>700,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-21</nobr>
//                         </td>
//                         <td>
//                           Демонтаж ввода 1-фазного от электросетевых объектов
//                           АО&nbsp;«Мособлэнерго» до потребителя
//                         </td>
//                         <td>1 м.</td>
//                         <td>250,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-22</nobr>
//                         </td>
//                         <td>
//                           Демонтаж ввода 3-фазного от электросетевых объектов
//                           АО&nbsp;«Мособлэнерго» до потребителя
//                         </td>
//                         <td>1 м.</td>
//                         <td>350,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-23</nobr>
//                         </td>
//                         <td>
//                           Замена ввода <nobr>1-фазного</nobr> от электросетевых
//                           объектов АО «Мособлэнерго» до потребителя (натяжка
//                           провода СИП)
//                         </td>
//                         <td>1 м.</td>
//                         <td>800,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-24</nobr>
//                         </td>
//                         <td>
//                           Замена ввода <nobr>3-фазного</nobr> от электросетевых
//                           объектов АО «Мособлэнерго» до потребителя (натяжка
//                           провода СИП)
//                         </td>
//                         <td>1 м.</td>
//                         <td>900,00</td>
//                       </tr>

//                       <tr>
//                         <td>
//                           <nobr>12-25</nobr>
//                         </td>
//                         <td>Установка железобетонной опоры</td>
//                         <td>шт.</td>
//                         <td>25 000,00</td>
//                       </tr>

//                       <tr>
//                         <td>
//                           <nobr>12-26</nobr>
//                         </td>
//                         <td>Установка автоматического выключателя 1-фазного</td>
//                         <td>шт.</td>
//                         <td>2 500,00</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>12-27</nobr>
//                         </td>
//                         <td>Установка автоматического выключателя 3-фазного</td>
//                         <td>шт.</td>
//                         <td>3 000,00</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 13. Предоставление доступа к электросетевой инфраструктуре для
//                 размещения линии связи (ВОЛС) и другого оборудования
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     {" "}
//                     <b>8 (495) 780-39-62</b>{" "}
//                   </a>
//                   доб. 3327, доб. 1096; e-mail:
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     {" "}
//                     <b>uslugi@mosoblenergo.ru</b>{" "}
//                   </a>
//                 </p>
//                 <p>
//                   {" "}
//                   АО «Мособлэнерго» предлагает интернет-провайдерам услуги по
//                   размещению волоконно-оптических линий связи (ВОЛС) на
//                   воздушных линиях электропередач.
//                 </p>
//                 <p>
//                   Размещение волоконно-оптических линий связи на воздушных
//                   линиях электропередачи АО&nbsp;«Мособлэнерго», находящихся в
//                   60 муниципальных районах Московской области, позволит провести
//                   интернет в самые отдаленные населенные пункты Московской
//                   области при минимальных затратах, а также установить системы
//                   видеонаблюдения и телекоммуникаций в максимально удобно
//                   расположенных местах.
//                 </p>

//                 <div className="row-docs-age">
//                   <a
//                     className="doc-line"
//                     href={`${addressServer}/uploads/perechen_speczialnyh_obektov_infrastruktury_k_kotorym_mozhet_byt_predostavlen_dostup_vladelczem_infrastruktury_c0de23cf7a.pdf?updated_at=2023-09-12T10:30:21.579Z`}
//                     download=""
//                     rel="noopener noreferrer"
//                     target="_blank"
//                   >
//                     <div className="doc-line__wrap-icon">
//                       <img src={pdf} alt="icon pdf" />
//                     </div>
//                     <div className="doc-line__wrap-text">
//                       <span className="doc-line__name">
//                         Перечень специальных объектов инфраструктуры, к которым
//                         может быть предоставлен доступ владельцем инфраструктуры
//                       </span>
//                       <span className="doc-line__file-info">pdf, 298 кб</span>
//                     </div>
//                   </a>
//                   <a
//                     className="doc-line"
//                     href={`${addressServer}/uploads/Poryadok_formirovaniya_tarifov_za_predostavlenie_dostupa_k_infrastrukture_d3b574f538.pdf?updated_at=2023-09-06T06:30:51.957Z`}
//                     download=""
//                     rel="noopener noreferrer"
//                     target="_blank"
//                   >
//                     <div className="doc-line__wrap-icon">
//                       <img src={pdf} alt="icon pdf" />
//                     </div>
//                     <div className="doc-line__wrap-text">
//                       <span className="doc-line__name">
//                         Порядок формирования тарифов за предоставление доступа к
//                         инфраструктуре
//                       </span>
//                       <span className="doc-line__file-info">pdf, 609 кб</span>
//                     </div>
//                   </a>
//                   <a
//                     className="doc-line"
//                     href={`${addressServer}/uploads/informacziya_o_poryadke_i_usloviyah_vypolneniya_zaprosov_na_predostavlenie_informaczii_o_dostupe_k_konkretnym_obektam_infrastruktury_1377920769.pdf?updated_at=2023-09-12T10:30:21.553Z`}
//                     download=""
//                     rel="noopener noreferrer"
//                     target="_blank"
//                   >
//                     <div className="doc-line__wrap-icon">
//                       <img src={pdf} alt="icon pdf" />
//                     </div>
//                     <div className="doc-line__wrap-text">
//                       <span className="doc-line__name">
//                         Информация о порядке и условиях выполнения запросов на
//                         предоставление информации о доступе к конкретным
//                         объектам инфраструктуры
//                       </span>
//                       <span className="doc-line__file-info">pdf, 255 кб</span>
//                     </div>
//                   </a>
//                   <a
//                     className="doc-line"
//                     href={`${addressServer}/uploads/Reestr_zayavok_dlya_sajta_19_07_24_619f2af2df.pdf?updated_at=2024-07-19T10:18:52.020Z`}
//                     download=""
//                     rel="noopener noreferrer"
//                     target="_blank"
//                   >
//                     <div className="doc-line__wrap-icon">
//                       <img src={pdf} alt="icon pdf" />
//                     </div>
//                     <div className="doc-line__wrap-text">
//                       <span className="doc-line__name">
//                         Реестр заявлений о предоставлении доступа к
//                         инфраструктуре
//                       </span>
//                       <span className="doc-line__file-info">pdf, 339 кб</span>
//                     </div>
//                   </a>
//                   <a
//                     className="doc-line"
//                     href={`${addressServer}/uploads/Svedeniya_o_razmere_platy_za_predostavlenie_informaczii_15023783b0.pdf?updated_at=2023-09-15T10:37:46.193Z`}
//                     download=""
//                     rel="noopener noreferrer"
//                     target="_blank"
//                   >
//                     <div className="doc-line__wrap-icon">
//                       <img src={pdf} alt="icon pdf" />
//                     </div>
//                     <div className="doc-line__wrap-text">
//                       <span className="doc-line__name">
//                         Сведения о размере платы за предоставление информации
//                       </span>
//                       <span className="doc-line__file-info">pdf, 318 кб</span>
//                     </div>
//                   </a>
//                 </div>

//                 <div className="accordion-row">
//                   <div className="accordion-row__up" onClick={handlerRowUp}>
//                     <span className="accordion-row__text">
//                       13.1. Условия доступа к инфраструктуре (заключение
//                       договора о предоставлении доступа к инфраструктуре на
//                       основании пункта 20 Правил недискриминационного доступа к
//                       инфраструктуре для размещения сетей электросвязи)
//                     </span>
//                     <div className="accordion-row__wrap-arrow"></div>
//                   </div>
//                   <div className="accordion-row__drop-down">
//                     <div className="accordion-row__wrapper">
//                       <div className="row-docs-age">
//                         <a
//                           className="doc-line"
//                           href={`${addressServer}/uploads/forma_zayavki_DOGOVOR_c65ab212b4.docx?updated_at=2023-09-06T06:30:51.504Z`}
//                           download=""
//                           rel="noopener noreferrer"
//                           target="_blank"
//                         >
//                           <div className="doc-line__wrap-icon">
//                             <img src={docx} alt="icon docx" />
//                           </div>
//                           <div className="doc-line__wrap-text">
//                             <span className="doc-line__name">
//                               Форма заявки на заключение возмездного договора о
//                               предоставлении доступа к инфраструктуре
//                             </span>
//                             <span className="doc-line__file-info">
//                               docx, 18 кб
//                             </span>
//                           </div>
//                         </a>
//                       </div>
//                       <div className="wrap-table">
//                         <p>
//                           Актуальный прайслист Вы можете скачать по ссылке внизу
//                           страницы.
//                         </p>
//                         {/* <table align="center">
//                           <colgroup>
//                             <col /> <col /> <col /> <col />
//                           </colgroup>
//                           <tbody>
//                             <tr>
//                               <th style={{ textAlign: "center" }}>Код</th>
//                               <th style={{ textAlign: "center" }}>
//                                 Наименование услуги
//                               </th>
//                               <th style={{ textAlign: "center" }}>
//                                 Ед. измерения
//                               </th>
//                               <th style={{ textAlign: "center" }}>
//                                 Цена, руб. с НДС (в месяц)*
//                               </th>
//                             </tr>

//                             <tr>
//                               <td style={{ textAlign: "center" }}>13-01</td>
//                               <td style={{ textAlign: "center" }}>
//                                 Тариф за предоставление доступа сторонним лицам
//                                 (пользователям) к воздушным линиям 0,4 кВ для
//                                 размещения волоконно-оптических линий связи{" "}
//                               </td>
//                               <td style={{ textAlign: "center" }}>
//                                 1 место подвеса на опоре
//                               </td>
//                               <td style={{ textAlign: "center" }}>74,06</td>
//                             </tr>
//                             <tr>
//                               <td style={{ textAlign: "center" }}>13-02</td>
//                               <td style={{ textAlign: "center" }}>
//                                 Тариф за предоставление доступа сторонним лицам
//                                 (пользователям) к воздушным линиям 6/10 кВ для
//                                 размещения волоконно-оптических линий связи
//                               </td>
//                               <td style={{ textAlign: "center" }}>
//                                 1 место подвеса на опоре
//                               </td>
//                               <td style={{ textAlign: "center" }}>99,29</td>
//                             </tr>
//                           </tbody>
//                         </table> */}
//                         <p>
//                           * Дифференциация тарифа в зависимости от количества
//                           объектов инфраструктуры или их частей, к которым
//                           предоставлен доступ, сроков их использования, а также
//                           технологических особенностей размещения сети
//                           электросвязи или отдельных ее элементов, не
//                           предусмотрена.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="accordion-row">
//                   <div className="accordion-row__up" onClick={handlerRowUp}>
//                     <span className="accordion-row__text">
//                       13.2. Условия и порядок представления информации об
//                       условиях доступа к инфраструктуре (представление
//                       информации, предусмотренной пунктом 13 Правил
//                       недискриминационного доступа к инфраструктуре для
//                       размещения сетей электросвязи)
//                     </span>
//                     <div className="accordion-row__wrap-arrow"></div>
//                   </div>
//                   <div className="accordion-row__drop-down">
//                     <div className="accordion-row__wrapper">
//                       <div className="row-docs-age">
//                         <a
//                           className="doc-line"
//                           href={`${addressServer}/uploads/forma_zayavki_PREDOSTAVLENIE_INFORMACII_1_94fcb3771d.docx?updated_at=2023-11-27T07:14:43.665Z`}
//                           download=""
//                           rel="noopener noreferrer"
//                           target="_blank"
//                         >
//                           <div className="doc-line__wrap-icon">
//                             <img src={docx} alt="icon docx" />
//                           </div>
//                           <div className="doc-line__wrap-text">
//                             <span className="doc-line__name">
//                               Форма заявки на предоставление информации о
//                               возможности доступа к электросетевой
//                               инфраструктуре и выдачу технических условий
//                             </span>
//                             <span className="doc-line__file-info">
//                               docx, 25 кб
//                             </span>
//                           </div>
//                         </a>
//                       </div>
//                       <div className="wrap-table">
//                         <p>
//                           Актуальный прайслист Вы можете скачать по ссылке внизу
//                           страницы.
//                         </p>
//                         {/* <table align="center">
//                           <tbody>
//                             <tr>
//                               <th style={{ textAlign: "center" }}>Код</th>
//                               <th style={{ textAlign: "center" }}>
//                                 Наименование услуги
//                               </th>
//                               <th style={{ textAlign: "center" }}>
//                                 Ед. измерения
//                               </th>
//                               <th style={{ textAlign: "center" }}>
//                                 Цена, руб. с НДС (в месяц)*
//                               </th>
//                             </tr>

//                             <tr>
//                               <td style={{ textAlign: "center" }}>13-05</td>
//                               <td style={{ textAlign: "center" }}>
//                                 Подготовка и выдача технических условий по
//                                 размещению ВОЛС и оборудования
//                               </td>
//                               <td style={{ textAlign: "center" }}>ТУ</td>
//                               <td style={{ textAlign: "center" }}>19 000,00</td>
//                             </tr>
//                           </tbody>
//                         </table> */}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="accordion-row">
//                   <div className="accordion-row__up" onClick={handlerRowUp}>
//                     <span className="accordion-row__text">
//                       13.3. Дополнительные услуги по запросу пользователя
//                       инфраструктуры
//                     </span>
//                     <div className="accordion-row__wrap-arrow"></div>
//                   </div>
//                   <div className="accordion-row__drop-down">
//                     <div className="accordion-row__wrapper">
//                       <ul>
//                         <li>
//                           <a
//                             href={`${addressServer}/uploads/forma_zayavki_dlya_yuridicheskogo_licza_543ad332e0.doc?updated_at=2023-08-30T11:03:18.346Z`}
//                           >
//                             Форма заявки для юридических лиц
//                           </a>
//                         </li>
//                         <li>
//                           <a
//                             href={`${addressServer}/uploads/Forma_zayavki_dlya_individualnyh_predprinimatelej_78e37b533f.doc?updated_at=2023-08-30T11:03:18.164Z`}
//                           >
//                             Форма заявки для индивидуальных предпринимателей
//                           </a>
//                         </li>
//                         <li>
//                           <a
//                             href={`${addressServer}/uploads/forma_zayavki_dlya_fizicheskih_licz_b8172f82b0.doc?updated_at=2023-08-30T11:03:18.356Z`}
//                           >
//                             Форма заявки для физических лиц
//                           </a>
//                         </li>
//                       </ul>
//                       <div className="wrap-table">
//                         <p>
//                           Актуальный прайслист Вы можете скачать по ссылке внизу
//                           страницы.
//                         </p>
//                         {/* <table align="center">
//                           <colgroup>
//                             <col /> <col /> <col /> <col />
//                           </colgroup>
//                           <tbody>
//                             <tr>
//                               <td style={{ textAlign: "center" }}>13-08</td>
//                               <td style={{ textAlign: "center" }}>
//                                 Участие в работе комиссии по приемке размещения
//                                 ВОЛС/оборудования
//                               </td>
//                               <td style={{ textAlign: "center" }}>
//                                 день/1 чел.
//                               </td>
//                               <td style={{ textAlign: "center" }}>7 700,00</td>
//                             </tr>
//                             <tr>
//                               <td style={{ textAlign: "center" }}>13-09</td>
//                               <td style={{ textAlign: "center" }}>
//                                 Выезд представителя АО «Мособлэнерго» для
//                                 определения принадлежностикоммуникаций на
//                                 местности
//                               </td>
//                               <td style={{ textAlign: "center" }}>выезд</td>
//                               <td style={{ textAlign: "center" }}>3 000,00</td>
//                             </tr>

//                             <tr>
//                               <td style={{ textAlign: "center" }}>06-05</td>
//                               <td style={{ textAlign: "center" }}>
//                                 Надзор за выполнением сторонними организациями
//                                 строительных работ вблизи линий электропередачи
//                                 и другого электрооборудования
//                               </td>
//                               <td style={{ textAlign: "center" }}>
//                                 1 день (8 часов)
//                               </td>
//                               <td style={{ textAlign: "center" }}>14 300,00</td>
//                             </tr>
//                           </tbody>
//                         </table> */}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 14. Вынос (переустройство) объектов электросетевого хозяйства
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     uslugi@mosoblenergo.ru
//                   </a>
//                 </p>
//                 <p></p>
//                 <p></p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_dlya_yur_licz_vynos_2ef3cb97bd.doc?updated_at=2023-06-06T05:30:18.477Z`}
//                     >
//                       Форма заявки для юридических лиц
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_dlya_IP_vynos_d3d510d879.doc?updated_at=2023-06-06T05:30:18.423Z`}
//                     >
//                       Форма заявки для индивидуальных предпринимателей
//                     </a>
//                   </li>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_dlya_fiz_licz_vynos_89a5cb06c4.doc?updated_at=2023-06-06T05:30:18.464Z`}
//                     >
//                       Форма заявки для физических лиц
//                     </a>
//                   </li>
//                 </ul>
//                 <p></p>
//                 <p>
//                   {" "}
//                   <strong>
//                     Если Вы владеете земельным участком, на территории которого
//                     находятся электрические сети или электрооборудование (опоры,
//                     трансформаторные подстанции, подземные линии
//                     электропередачи), и Вы хотите перенести их за границы своего
//                     участка, АО «Мособлэнерго» предоставляет Вам комплексную
//                     услугу по выносу (переустройству) объектов электросетевого
//                     хозяйства, включающую в себя:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p>
//                       {" "}
//                       заключение договора на комплекс мероприятий по выносу
//                       (переустройству) объектов электросетевого хозяйства;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       предпроектное обследование участка, поиск технических и
//                       конструктивных решений возможного выноса (переустройства)
//                       сетей;{" "}
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       разработку проектной, рабочей и исполнительной
//                       документации;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       согласование проектной, рабочей и исполнительной
//                       документации со всеми заинтересованными лицами,
//                       организациями и службами (землепользователями и
//                       балансодержателями коммуникаций);
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       выполнение строительно-монтажных работ по освобождению
//                       земельного участка;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       технический надзор за сооружением электросетевых объектов;
//                     </p>
//                   </li>
//                   <li>
//                     <p> выполнение пуско-наладочных работ.</p>
//                   </li>
//                   <li>
//                     <p> выдача справки выполнения освобождения участка.</p>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   АО «Мособлэнерго» имеет значительный опыт выполнения выноса
//                   (переустройства) объектов электросетевого хозяйства.
//                 </p>
//                 <p>
//                   {" "}
//                   Имея в штате более 1500 единиц спецтехники и бригад
//                   квалифицированных работников, все работы проводятся в
//                   соответствии с требованиями закона и надзорных органов,
//                   качественно и в минимально возможные сроки.
//                 </p>
//                 <p>
//                   {" "}
//                   Результатом оказания услуги является снятие обременений с
//                   земельного участка. Это позволит Вам в полной мере
//                   использовать потенциал земельного участка, и повышает его
//                   рыночную стоимость.
//                 </p>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table align="center">
//                     <colgroup>
//                       <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <strong>Код</strong>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           <strong>Наименование услуги</strong>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           <strong>Ед. измерения</strong>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           <strong>Цена, руб. с НДС</strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>14-01</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Проведение комплекса мероприятий <br />
//                           по выносу (переустройству) объектов
//                           <br />
//                           &nbsp;электросетевого хозяйства <br />
//                           АО «Мособлэнерго» из зоны застройки
//                         </td>
//                         <td style={{ textAlign: "center" }}>объект</td>
//                         <td style={{ textAlign: "center" }}>индивидуально</td>
//                       </tr>
//                       <tr>
//                         <td rowSpan="2" style={{ textAlign: "center" }}>
//                           <nobr>14-02</nobr>
//                         </td>
//                         <td rowSpan="2" style={{ textAlign: "center" }}>
//                           Разработка Технических условий (заданий) <br />
//                           на вынос (переустройство) объектов <br />
//                           электросетевого хозяйства <br />
//                           АО «Мособлэнерго» из зоны застройки
//                         </td>
//                         <td rowSpan="2" style={{ textAlign: "center" }}>
//                           объект
//                         </td>
//                         <td rowSpan="2" style={{ textAlign: "center" }}>
//                           48 000,00
//                           <br />
//                           Стандартизированная ставка**
//                         </td>
//                       </tr>
//                       <tr></tr>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>14-03</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Разработка Технических условий <br />
//                           на сохранность объектов
//                           <br />
//                           &nbsp;электросетевого хозяйства <br />
//                           АО «Мособлэнерго»
//                         </td>
//                         <td style={{ textAlign: "center" }}>объект</td>
//                         <td style={{ textAlign: "center" }}>
//                           48 000,00
//                           <br />
//                           Стандартизированная ставка**
//                         </td>
//                       </tr>

//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <nobr>14-04</nobr>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           Технические условия <br />
//                           на пересечение <br />и параллельное следование <br />с
//                           объектами электросетевого <br />
//                           хозяйства АО&nbsp;«Мособлэнерго»
//                         </td>
//                         <td style={{ textAlign: "center" }}>объект</td>
//                         <td style={{ textAlign: "center" }}>
//                           48 000,00
//                           <br />
//                           Стандартизированная ставка**
//                         </td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//                 {/* <p>
//                   {" "}
//                   * В случае финансирования выноса (переустройства) сетей АО
//                   «Мособлэнерго» исключительно за счет средств коммерческих
//                   организаций, физических лиц, индивидуальных предпринимателей —
//                   выдача ТУ/ТЗ не осуществляется
//                 </p> */}
//                 <p>
//                   {" "}
//                   Согласно ст. 5 Федерального закона от 31.07.2020 №{" "}
//                   <nobr>254-ФЗ</nobr> «Об особенностях регулирования отдельных
//                   отношений в целях модернизации и расширения магистральной
//                   инфраструктуры и о внесении изменений в отдельные
//                   законодательные акты Российской Федерации» (далее — Закон{" "}
//                   <nobr>254-ФЗ)</nobr> в случае, если в связи с планируемым
//                   строительством или реконструкцией линейных объектов
//                   инфраструктуры необходима реконструкция линейного объекта, в
//                   течение двадцати дней со дня поступления обращения в
//                   письменной форме без взимания платы выдаются технические
//                   требования и условия, подлежащие обязательному исполнению при
//                   подготовке проектной документации.
//                 </p>
//                 {/* <p>
//                   {" "}
//                   ** Стоимость услуги утверждается ежегодно Комитетом по ценам и
//                   тарифам Московской области.
//                 </p> */}
//                 <p>
//                   {" "}
//                   Согласно статьи 52.2 ГрК РФ указанная стоимость услуги
//                   применима для линейных объектов транспортной инфраструктуры
//                   федерального значения, транспортной инфраструктуры
//                   регионального значения, транспортной инфраструктуры местного
//                   значения при наличии утвержденного в соответствии с частью
//                   12.12 статьи 45 ГрК РФ проекта планировки территории; для
//                   многоквартирных жилых домов, жилых домов блокированной
//                   застройки и необходимых для их функционирования объектов
//                   коммунальной инфраструктуры, объектов транспортной
//                   инфраструктуры, а также объектов социальной инфраструктуры,
//                   если предусмотрено изменение местоположения существующих
//                   линейных объектов.
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="accordion-row">
//             <div className="accordion-row__up" onClick={handlerRowUp}>
//               <span className="accordion-row__text">
//                 15. Услуги по техническому надзору за сооружением электросетевых
//                 объектов
//               </span>
//               <div className="accordion-row__wrap-arrow"></div>
//             </div>
//             <div className="accordion-row__drop-down">
//               <div className="accordion-row__wrapper">
//                 <p>
//                   По вопросам оказания дополнительных услуг свяжитесь с нами:
//                   тел.:{" "}
//                   <a href="tel:+74957803962">
//                     <b>8 (495) 780-39-62</b>
//                   </a>{" "}
//                   доб. 3327, доб. 1096; e-mail:{" "}
//                   <a href="mailto:uslugi@mosoblenergo.ru">
//                     <b>uslugi@mosoblenergo.ru</b>
//                   </a>
//                 </p>
//                 <ul>
//                   <li>
//                     <a
//                       href={`${addressServer}/uploads/forma_zayavki_strojkontrol_910ad79820.docx?updated_at=2023-06-06T05:30:18.518Z`}
//                     >
//                       Форма заявки на оказание услуг строительного контроля
//                     </a>
//                   </li>
//                 </ul>
//                 <p>
//                   {" "}
//                   Качественное выполнение строительно-монтажных работ является
//                   главным условием обеспечения надежности и долговечности
//                   строящихся объектов электросетевого хозяйства. АО
//                   «Мособлэнерго» предоставляет услуги по техническому надзору за
//                   сооружением электросетевых объектов. Наши инженеры
//                   строительного контроля уделят самое пристальное внимание
//                   соблюдению всех норм и правил.{" "}
//                 </p>
//                 <p>
//                   {" "}
//                   Используя большой опыт, знания и оборудование, специалисты
//                   нашей компании помогут Вам исключить факты нарушения
//                   технологии производства работ, результатом которых может стать
//                   снижение эксплуатационных характеристик объектов,
//                   возникновение гарантийных случаев после завершения
//                   строительства.
//                 </p>
//                 <p>
//                   {" "}
//                   <strong>
//                     В рамках технического надзора за проведением
//                     строительно-монтажных работ с выездом на объект
//                     осуществляется контроль:
//                   </strong>
//                 </p>
//                 <ul>
//                   <li>
//                     <p>
//                       {" "}
//                       за соблюдением технологии производства и качества
//                       строительно-монтажных работ в соответствии с положениями
//                       действующих СП, СНиП, иных нормативных документов;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       за соблюдением календарного плана строительно-монтажных
//                       работ;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       за соответствием используемых материалов и оборудования
//                       спецификации, указанной в проектной документации,
//                       организацией их складирования и хранения, наличием
//                       необходимых документов на используемые материалы;
//                     </p>
//                   </li>
//                   <li>
//                     <p>
//                       {" "}
//                       за подготовкой и предоставлением полного комплекта
//                       исполнительной документации, включающей в себя все
//                       исполнительные схемы, акты скрытых работ, паспорта и
//                       сертификаты на оборудование.
//                     </p>
//                   </li>
//                 </ul>
//                 <p>
//                   <b>
//                     Услуги по техническому надзору за сооружением электросетевых
//                     объектов (Норматив расхода на осуществление строительного
//                     контроля)*
//                   </b>
//                 </p>
//                 <div className="wrap-table">
//                   <p>
//                     Актуальный прайслист Вы можете скачать по ссылке внизу
//                     страницы.
//                   </p>
//                   {/* <table>
//                     <colgroup>
//                       <col /> <col /> <col /> <col />
//                     </colgroup>
//                     <tbody>
//                       <tr>
//                         <td style={{ textAlign: "center" }}>
//                           <strong>Код</strong>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           <strong>Наименование услуги</strong>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           <strong>Ед. измерения</strong>
//                         </td>
//                         <td style={{ textAlign: "center" }}>
//                           <strong>Норма расхода, %</strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-01</nobr>
//                         </td>
//                         <td>До 30 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>2,14</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-02</nobr>
//                         </td>
//                         <td>От 30 000 000 до 50 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,93</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-03</nobr>
//                         </td>
//                         <td>От 50 000 000 до 70 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,81</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-04</nobr>
//                         </td>
//                         <td>От 70 000 000 до 90 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,72</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-05</nobr>
//                         </td>
//                         <td>От 90 000 000 до 125 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,61</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-06</nobr>
//                         </td>
//                         <td>От 125 000 000 до 150 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,56</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-07</nobr>
//                         </td>
//                         <td>От 150 000 000 до 200 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,47</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-08</nobr>
//                         </td>
//                         <td>От 200 000 000 до 300 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,36</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-09</nobr>
//                         </td>
//                         <td>От 300 000 000 до 400 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,28</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-10</nobr>
//                         </td>
//                         <td>От 400 000 000 до 500 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,23</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-11</nobr>
//                         </td>
//                         <td>От 500 000 000 до 600 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,18</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-12</nobr>
//                         </td>
//                         <td>От 600 000 000 до 750 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,13</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <nobr>15-13</nobr>
//                         </td>
//                         <td>От 750 000 000 до 900 000 000 (руб.)</td>
//                         <td>объект</td>
//                         <td>1,09</td>
//                       </tr>
//                     </tbody>
//                   </table> */}
//                 </div>
//                 <p>
//                   * Определенный по таблице процент норматива расхода
//                   применяется к стоимости сметной документации, составленной в
//                   текущем уровне цен, принятом в договоре.
//                 </p>
//               </div>
//             </div>
//           </div>
//           <p></p>

//           <p>
//             По вопросам оказания дополнительных услуг свяжитесь с нами: тел.:{" "}
//             <a href="tel:+74957803962">
//               <b>8 (495) 780-39-62</b>
//             </a>{" "}
//             доб. 3327, доб. 1096; e-mail:{" "}
//             <a href="mailto:uslugi@mosoblenergo.ru">
//               <b>uslugi@mosoblenergo.ru</b>
//             </a>
//           </p>
//           <p>
//             *Представленная в разделе информация носит справочный характер и
//             приведена с целью информирования Заявителей о наличии, перечне и
//             условиях оказания коммерческих услуг. Информация не является
//             офертой, так как не имеет характера окончательного предложения в
//             связи с индивидуальными особенностями каждого заказа и
//             необходимостью согласования окончательных условий получения услуги
//             Заявителем.
//           </p>
//         </div>
//         <br />
//         <br />{" "}
//         <div className="row-docs-age">
//           <a
//             className="doc-line"
//             href={`${addressServer}/uploads/Prejskurant_dlya_skachivaniya_1_ae57c908db.pdf?updated_at=2024-09-27T10:07:11.107Z`}
//             download=""
//             rel="noopener noreferrer"
//             target="_blank"
//           >
//             <div className="doc-line__wrap-icon">
//               <img src={pdf} alt="icon pdf" />
//             </div>
//             <div className="doc-line__wrap-text">
//               <span className="doc-line__name">
//                 Скачать прейскурант коммерческих услуг
//               </span>
//               <span className="doc-line__file-info">pdf, 3 мб</span>
//             </div>
//           </a>
//         </div>
//       </div>
//     </motion.div>
//   );
// }