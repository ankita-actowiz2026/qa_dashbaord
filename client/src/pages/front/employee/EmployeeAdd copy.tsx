import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";

import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams } from "react-router";
import type { IEmployee } from "../../interface/employee.interface";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const tagOptions = [
  "Suspense",
  "Informative",
  "Knowledge",
  "Religious",
  "Health",
];
// yup schema
const schema = yup.object().shape({
  title: yup.string().required("Please add title"),
});

const EmployeeAdd = () => {
  const { id } = useParams();
  const [mode, setMode] = useState("add");
  let navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setMode("edit");
      const fetchEmployee = async () => {
        try {
          const response = await axios.get(BACKEND_URL + "/api/employee/" + id);
          setValue("title", response.data.data.title);
          setValue("email", response.data.data.email);
          setValue("description", response.data.data.description);
          setValue("author", response.data.data.author);
          setValue("published", response.data.data.published.toString());
          setValue("option_type", response.data.data.option_type);
          setValue("tags", response.data.data.tags);
          setValue("skills", response.data.data.skills);
        } catch (error: any) {
          if (error.status == 422) {
            setMsg(error?.response?.data?.message);
            setMsgType("error");
            // navigate("employee/list");
          }
        }
      };
      fetchEmployee();
    }
  }, []);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IEmployee>({
    resolver: yupResolver(schema),
    defaultValues: {
      skills: [],
      //  published: "false",
      tags: [],
    },
  });
  const formValues = watch();
  console.log(formValues);

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");

  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => {
        setMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [msg]);
  const onSubmit = async (data: IEmployee) => {
    try {
      const send_data = {
        title: data.title,
        email: data.email,
        description: data.description,
        author: data.author,
        published: data.published,
        option_type: data.option_type,
        tags: data.tags,
        skills: data.skills,
      };
      let response: any;
      if (mode == "add") {
        response = await axios.post(BACKEND_URL + "/api", send_data);
      } else {
        response = await axios.put(
          BACKEND_URL + "/api/employee/" + id,
          send_data,
        );
      }

      if (response?.status === 201) {
        setMsg(response.data.message);
        setMsgType("success");
        navigate("/employee/list", {
          state: { msg: response?.data?.message, type: "success" },
        });
      }
    } catch (error: any) {
      if (error.status == 422) {
        setMsg(error?.response?.data?.message);
        setMsgType("error");
      }
    }
  };

  return (
    <Container>
      {msg && (
        <div className="d-flex justify-content-center mt-3">
          <div
            className={`alert ${
              msgType === "success" ? "alert-success" : "alert-danger"
            } text-center`}
            role="alert"
            style={{ minWidth: "300px" }}
          >
            {msg}
          </div>
        </div>
      )}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row>
          <Form.Group as={Col} md="4">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="title"
              name="title"
              {...register("title")}
              isInvalid={!!errors.title}
            />

            <Form.Control.Feedback type="invalid">
              {errors.title && <p>{errors.title.message}</p>}
            </Form.Control.Feedback>
          </Form.Group>
        </Row>

        <div className="mt-3 d-flex gap-2">
          <Button type="submit" variant="primary">
            Save
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
      </Form>
    </Container>
  );
};
export default EmployeeAdd;
