import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, Flex, Spin, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopImage from "../../components/TopImage";
import img5d1dda82e3641ae19df5a51619ffb49c from "../../img/5d1dda82e3641ae19df5a51619ffb49c.jpg";
import styles from "./SpecialProjects.module.css";

import { addressServer } from "../../config";

// const addressServer =
//   process.env.REACT_APP_BACKEND_SERVER || "https://mosoblenergo.ru/back";

export default function SpecialProjects() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(
          `${addressServer}/api/speczialnye-proekties?populate=*`
        );
        const eventData = response.data.data.map((event) => ({
          id: event.id,
          title: event.title,
          sort: event.sort,
          date: event.dateEvent
            ? new Date(event.dateEvent).toLocaleDateString()
            : false,
          shortDescription: event.shortDescription,
          description: event.description,
          image: `${addressServer}${event.mainPhoto.url}`,
          link: `/specialProjects/${event.documentId}`,
        }));
        setEvents(eventData);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return <Spin size="large" style={{ display: "block", margin: "0 auto" }} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <TopImage
        image={img5d1dda82e3641ae19df5a51619ffb49c}
        title={"Специальные проекты"}
      />
      <div className="container">

      {/* <div className={styles.content} id="content"> */}
       <Flex className={styles.content} gap={20} align="stretch" wrap>

          {events.sort((a, b) => b.sort - a.sort).map((event) => (
            
              <Card
                hoverable
                className={styles.card}
                cover={
                  <div className={styles.cover}>
                    <img alt={event.title} src={event.image} />
                  </div>
                }
                onClick={() => navigate(event.link)}
              >
                <div className={styles.cardContent}>
                  <Typography.Title level={2}>{event.title}</Typography.Title>
                  <Typography.Paragraph type="secondary">
                    {event.date ? event.date : " "}
                  </Typography.Paragraph>
                  <Typography.Paragraph>
                    {event.shortDescription}
                  </Typography.Paragraph>
                </div>
              </Card>
            ))}
        </Flex>

        {/* </div> */}
      </div>
    </motion.div>
  );
}
