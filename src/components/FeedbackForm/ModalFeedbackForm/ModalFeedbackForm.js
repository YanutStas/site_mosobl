import React, { useState } from "react";
import style from "./ModalFeedbackForm.module.css";
import ModalWindow from "../ModalWindowEnd/ModalWindowEnd";

export default function Modal({ onClose }) {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [selectedIssue, setSelectedIssue] = useState("");
  const [selectedSubIssue, setSelectedSubIssue] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [deviceLocationAddress, setDeviceLocationAddress] = useState("");
  const [inquiryReason, setInquiryReason] = useState("");
  const [claimDateRange, setClaimDateRange] = useState("");
  const [chargingStationAddress, setChargingStationAddress] = useState("");
  const [chargingStationId, setChargingStationId] = useState("");
  const [objectLocationAddress, setObjectLocationAddress] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [photoMaterials, setPhotoMaterials] = useState("");
  const [lineCharacteristics, setLineCharacteristics] = useState("");
  const [objectName, setObjectName] = useState("");
  const [technicalSpecs, setTechnicalSpecs] = useState("");
  const [applicationOrContractNumber, setApplicationOrContractNumber] =
    useState("");

  const issueOptions = {
    powerOutage: "Отключение электроэнергии",
    powerQuality: "Качество электроснабжения",
    carElectricChargingStations: "Автомобильные электрозарядные станции",
    electricitymeteringdevices: `Приборы учета электроэнергии (в т. ч. в
          садоводческих/огороднических некоммерческих товариществах)`,
    malfunctionofpowerlines: "Неисправности линий электропередач",
    transferoftheelectricgrid: `Передача электросетевого хозяйства на баланс электросетевой организации`,
    connectionelectricnetworks:
      "Технологическое присоединение к электрическим сетям",
    additionalservices: "Дополнительные услуги",
    other: "Другое",
  };

  const handleIssueChange = (event) => {
    setSelectedIssue(event.target.value);
    setSelectedSubIssue("");
  };

  const handleSubIssueChange = (event) => {
    setSelectedSubIssue(event.target.value);
  };

  const generateEmailBody = (issue, subIssue, details) => {
    const commonDetails =
      `ФИО заявителя:\n${details.fullName}\n\n` +
      `адрес электронной почты для обратной связи:\n${details.email}\n\n` +
      `телефон для обратной связи:\n${details.phone}\n\n`;

    switch (issue) {
      case "powerOutage":
        return (
          commonDetails +
          `адрес места инцидента:\n${details.address}\n\n` +
          `дата и время инцидента:\n${details.incidentDate}\n`
        );
      case "powerQuality":
        return (
          commonDetails +
          `адрес нахождения энергопринимающих устройств:\n${details.deviceLocationAddress}\n\n` +
          `причина обращения:\n${details.inquiryReason}\n\n` +
          `дата/период времени претензии:\n${details.claimDateRange}\n`
        );
      case "carElectricChargingStations":
        let chargingStationDetails =
          commonDetails +
          `адрес нахождения ЭЗС / адрес предполагаемой установки ЭЗС:\n${details.chargingStationAddress}\n\n`;
        if (subIssue === "malfunction") {
          chargingStationDetails += `номер ЭЗС:\n${details.chargingStationId}\n\n`;
        }
        return chargingStationDetails;
      case "electricitymeteringdevices":
        return (
          commonDetails +
          `адрес нахождения объекта:\n${details.objectLocationAddress}\n\n` +
          `номер лицевого счета (при наличии):\n${details.accountNumber}\n`
        );
      case "malfunctionofpowerlines":
        let malfunctionDetails =
          commonDetails +
          `Выбранная подтема: ${subIssueText(subIssue)}\n\n` +
          `адрес места инцидента/ адрес нахождения объекта (г.о., населенный пункт, улица, номер дома):\n${details.address}\n\n` +
          `дата и время инцидента:\n${details.incidentDate}\n\n` +
          `причина обращения:\n${details.inquiryReason}\n\n` +
          `фотоматериалы:\n${details.photoMaterials}\n\n` +
          `характеристика линии (магистральная линия/вводной провод в дом):\n${details.lineCharacteristics}\n\n`
        return malfunctionDetails;
      case "transferoftheelectricgrid":
        return (
          commonDetails +
          `наименование объекта (ТП, линии электропередачи и ид.):\n${details.objectName}\n\n` +
          `адрес нахождения объекта:\n${details.address}\n\n` +
          `технические характеристики (класс напряжения, протяженность ВЛ/КЛ, трансформаторная мощность):\n${details.technicalSpecs}\n`
        );
      case "connectionelectricnetworks":
        return (
          commonDetails +
          `номер заявки/договора (при наличии):\n${details.applicationOrContractNumber}\n`
        );
      case "additionalservices":
        return commonDetails + `причина обращения:\n${details.inquiryReason}\n`;
      default:
        return commonDetails;
    }
  };

  const subIssueText = (subIssue) => {
    switch (subIssue) {
      case "zoneMalfunction":
        return "Охранные зоны";
      case "pruning":
        return "Опиловка";
      case "wireBreak":
        return "Обрыв проводов";
      case "pillarCondition":
        return "Состояние опор";
      default:
        return "Не указано";
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const emailBodyDetails = {
      fullName,
      email,
      phone,
      address,
      incidentDate,
      deviceLocationAddress,
      inquiryReason,
      claimDateRange,
      chargingStationAddress,
      chargingStationId,
      objectLocationAddress,
      accountNumber,
      lineCharacteristics,
      photoMaterials,
      objectName,
      technicalSpecs,
      applicationOrContractNumber,
    };

    const body = generateEmailBody(
      selectedIssue,
      selectedSubIssue,
      emailBodyDetails
    );

    setPreviewContent(body);

    setIsPreviewModalOpen(true);

    const subject = encodeURIComponent(
      issueOptions[selectedIssue] || "Обращение в службу поддержки"
    );
    const encodedBody = encodeURIComponent(body);
    window.location.href = `mailto:mail@mosoblenergo.ru?subject=${subject}&body=${encodedBody}`;
  };

  return (
    <>
      <div className={style.modalBackground}>
        <div className={style.modalContent}>
          <form onSubmit={handleSubmit}>
            <select onChange={handleIssueChange} defaultValue="">
              <option value="" disabled>
                Выберите вопрос
              </option>
              <option value="powerOutage">Отключение электроэнергии</option>
              <option value="powerQuality">Качество электроснабжения</option>
              <option value="carElectricChargingStations">
                Автомобильные электрозарядные станции
              </option>
              <option value="electricitymeteringdevices">
                Приборы учета электроэнергии (в т. ч. в
                садоводческих/огороднических некоммерческих товариществах)
              </option>
              <option value="malfunctionofpowerlines">
                Неисправности линий электропередач
              </option>
              <option value="transferoftheelectricgrid">
                Передача электросетевого хозяйства на баланс электросетевой
                организации
              </option>
              <option value="connectionelectricnetworks">
                Технологическое присоединение к электрическим сетям
              </option>
              <option value="additionalservices">Дополнительные услуги</option>
              <option value="other">Прочее</option>
            </select>

            {selectedIssue === "carElectricChargingStations" && (
              <select onChange={handleSubIssueChange} defaultValue="">
                <option value="" disabled>
                  Выберите подтему
                </option>
                <option value="malfunction">Неисправность ЭЗС</option>
                <option value="installation">Установка ЭЗС</option>
              </select>
            )}

            {selectedIssue === "malfunctionofpowerlines" && (
              <select onChange={handleSubIssueChange} defaultValue="">
                <option value="" disabled>
                  Выберите подтему
                </option>
                <option value="zoneMalfunction">Охранные зоны</option>
                <option value="pruning">Опиловка</option>
                <option value="wireBreak">Обрыв проводов</option>
                <option value="pillarCondition">Состояние опор</option>
              </select>
            )}

            {selectedIssue === "powerOutage" && (
              <>
                <input
                  type="text"
                  name="fullName"
                  placeholder="ФИО заявителя"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="адрес электронной почты для обратной связи"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="телефон для обратной связи"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <input
                  type="text"
                  name="address"
                  placeholder="адрес места инцидента"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <input
                  type="datetime-local"
                  name="incidentDate"
                  placeholder="дата и время инцидента"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                />
              </>
            )}

            {selectedIssue === "powerQuality" && (
              <>
                <input
                  type="text"
                  name="fullName"
                  placeholder="ФИО заявителя"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="адрес электронной почты для обратной связи"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="телефон для обратной связи"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <input
                  type="text"
                  name="deviceLocationAddress"
                  placeholder="адрес нахождения энергопринимающих устройств"
                  value={deviceLocationAddress}
                  onChange={(e) => setDeviceLocationAddress(e.target.value)}
                />
                <textarea
                  name="inquiryReason"
                  placeholder="причина обращения"
                  value={inquiryReason}
                  onChange={(e) => setInquiryReason(e.target.value)}
                />
                <input
                  type="text"
                  name="claimDateRange"
                  placeholder="дата/период времени претензии"
                  value={claimDateRange}
                  onChange={(e) => setClaimDateRange(e.target.value)}
                />
              </>
            )}

            {selectedIssue === "carElectricChargingStations" &&
              selectedSubIssue && (
                <>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="ФИО заявителя"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="адрес электронной почты для обратной связи"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="телефон для обратной связи"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    type="text"
                    name="chargingStationAddress"
                    placeholder="адрес нахождения ЭЗС / адрес предполагаемой установки ЭЗС"
                    value={chargingStationAddress}
                    onChange={(e) => setChargingStationAddress(e.target.value)}
                  />
                  {selectedSubIssue === "malfunction" && (
                    <input
                      type="text"
                      name="chargingStationId"
                      placeholder="номер ЭЗС"
                      value={chargingStationId}
                      onChange={(e) => setChargingStationId(e.target.value)}
                    />
                  )}
                </>
              )}

            {selectedIssue === "electricitymeteringdevices" && (
              <>
                <input
                  type="text"
                  name="fullName"
                  placeholder="ФИО заявителя"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="адрес электронной почты для обратной связи"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="телефон для обратной связи"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <input
                  type="text"
                  name="objectLocationAddress"
                  placeholder="адрес нахождения объекта"
                  value={objectLocationAddress}
                  onChange={(e) => setObjectLocationAddress(e.target.value)}
                />
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="номер лицевого счета (при наличии)"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </>
            )}

            {selectedIssue === "malfunctionofpowerlines" &&
              selectedSubIssue && (
                <>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="ФИО заявителя"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="адрес электронной почты для обратной связи"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="телефон для обратной связи"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="адрес места инцидента/ адрес нахождения объекта (г.о., населенный пункт, улица, номер дома)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <input
                    type="datetime-local"
                    name="incidentDate"
                    placeholder="дата и время инцидента"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                  />
                  <input
                    type="text"
                    name="inquiryReason"
                    placeholder="причина обращения"
                    value={inquiryReason}
                    onChange={(e) => setInquiryReason(e.target.value)}
                  />
                  <input
                    type="text"
                    name="photoMaterials"
                    placeholder="фотоматериалы"
                    value={photoMaterials}
                    onChange={(e) => setPhotoMaterials(e.target.value)}
                  />
                  <input
                    type="text"
                    name="lineCharacteristics"
                    placeholder="характеристика линии (магистральная линия/вводной провод в дом)"
                    value={lineCharacteristics}
                    onChange={(e) => setLineCharacteristics(e.target.value)}
                  />
                </>
              )}

            {selectedIssue === "transferoftheelectricgrid" && (
              <>
                <input
                  type="text"
                  name="fullName"
                  placeholder="ФИО заявителя"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="адрес электронной почты для обратной связи"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="телефон для обратной связи"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <input
                  type="text"
                  name="objectName"
                  placeholder="наименование объекта (ТП, линии электропередачи и ид.)"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="адрес нахождения объекта"
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <input
                  type="text"
                  name="technicalSpecs"
                  placeholder="технические характеристики (класс напряжения, протяженность ВЛ/КЛ, трансформаторная мощность)"
                  value={technicalSpecs}
                  onChange={(e) => setTechnicalSpecs(e.target.value)}
                />
              </>
            )}

            {selectedIssue === "connectionelectricnetworks" && (
              <>
                <input
                  type="text"
                  name="fullName"
                  placeholder="ФИО заявителя"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="адрес электронной почты для обратной связи"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="телефон для обратной связи"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <input
                  type="text"
                  name="applicationOrContractNumber"
                  placeholder="номер заявки/договора (при наличии)"
                  value={applicationOrContractNumber}
                  onChange={(e) =>
                    setApplicationOrContractNumber(e.target.value)
                  }
                />
              </>
            )}

            {selectedIssue === "additionalservices" && (
              <>
                <input
                  type="text"
                  name="fullName"
                  placeholder="ФИО заявителя"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="адрес электронной почты для обратной связи"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="телефон для обратной связи"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <input
                  type="text"
                  name="inquiryReason"
                  placeholder="причина обращения"
                  value={inquiryReason}
                  onChange={(e) => setInquiryReason(e.target.value)}
                />
                <p className={style.dopinformation}>
                  С полным списком и условиями оказания дополнительных услуг, а
                  также с формами заявок и перечнем обязательных документов для
                  оказания услуг Вы можете ознакомиться в разделе «Потребителям»
                  по ссылке:
                  <a
                    href=" https://mosoblenergo.ru/additiona/Services"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://mosoblenergo.ru/additiona/Services
                  </a>
                  . В случае заинтересованности прикрепите заполненную заявку на
                  дополнительную услугу к письму. Если у Вас остались вопросы
                  свяжитесь с нами по тел.: 8 (495) 780-39-62 доб. 3327, доб.
                  1096, или по e-mail:
                  <a href="mailto:uslugi@mosoblenergo.ru">
                    uslugi@mosoblenergo.ru
                  </a>
                  .
                </p>
              </>
            )}

            {selectedIssue === "other" && (
              <>
                <input
                  type="text"
                  name="fullName"
                  placeholder="ФИО заявителя"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="адрес электронной почты для обратной связи"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="телефон для обратной связи"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </>
            )}

            <label class="checkboxContainer">
              <input type="checkbox" required />
              <span class="checkboxText">
                Отправляя письмо, Вы даете согласие на обработку персональных
                данных, а также несете ответственность за полноту и
                достоверность предоставленной информации.
              </span>
            </label>

            <p className={style.disclaimer}>
              * При регистрации заявитель должен подтвердить свое согласие на
              обработку персональных данных.
            </p>
            <p className={style.disclaimer}>
              * Федеральный закон Nº59-ФЗ от 02.05.2006 о порядке рассмотрения
              обращений граждан Российской Федерации.
            </p>

            <button style={{marginTop:'5px'}} className="btn__send" type="submit">
              Отправить
            </button>
          </form>
          <button style={{marginTop:'15px'}} className="btn__close" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>

      {isPreviewModalOpen && (
        <ModalWindow
          title={issueOptions[selectedIssue]}
          content={previewContent}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
    </>
  );
}