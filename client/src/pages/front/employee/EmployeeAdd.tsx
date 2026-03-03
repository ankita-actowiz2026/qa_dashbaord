import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";

import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams } from "react-router";
import type { IEmployee } from "../../interface/employee.interface";

import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
type FormDataType = {
  multiple_image: File[];
};
const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  single_image: yup
    .mixed()
    .required("Image is requireda")
    .test("fileType", "Only JPG or PNG files are allowed", (value) => {
      if (!value || !(value instanceof File)) return false;
      return ["image/jpeg", "image/png"].includes((value as File).type);
    })
    .test("fileSize", "File too large (max 2MB)", (value) => {
      if (!value || !(value instanceof File)) return false;
      return value.size <= 2 * 1024 * 1024;
    }),
  multiple_image: yup
    .mixed()
    .test("required", "At least one file required", (value: any) => {
      return value && value.length > 0;
    }),
  DOB: yup
    .date()
    .typeError("Please select a valid date")
    .required("Date is required")
    //.min(new Date(), "Past dates are not allowed"),
    .max(new Date(), "Post dates are not allowed"),
});

const editSchema = yup.object().shape({
  title: yup.string().required("Title is required"),
  single_image: yup
    .mixed()
    .test("fileType", "Only JPG or PNG files are allowed", (value) => {
      if (!value) return true;
      if (!value || !(value instanceof File)) return false;
      return ["image/jpeg", "image/png"].includes((value as File).type);
    })
    .test("fileSize", "File too large (max 2MB)", (value) => {
      if (!value) return true;
      if (!value || !(value instanceof File)) return false;
      return value.size <= 2 * 1024 * 1024;
    }),
  DOB: yup
    .date()
    .typeError("Please select a valid date")
    .required("Date is required")
    //.min(new Date(), "Past dates are not allowed"),
    .max(new Date(), "Post dates are not allowed"),
});
function EmployeeAdd() {
  const { id } = useParams();
  const topRef = useRef<HTMLHeadingElement>(null);
  const [mode, setMode] = useState("add");
  let navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger" | "">("");
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImagesPreview, setNewImagesPreview] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  useEffect(() => {
    if (id) setMode("edit");
  }, [id]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      newImagesPreview.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [preview, newImagesPreview]);
  useEffect(() => {
    if (msg && msgType === "danger") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      requestAnimationFrame(() => topRef.current?.focus());
    }
  }, [msg, msgType]);
  const handleRemoveExisting = (imgPath: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== imgPath));
  };
  const handleRemoveNew = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagesPreview((prev) => prev.filter((_, i) => i !== index));
  };
  useEffect(() => {
    if (!id) return;
    const fetchEmployee = async () => {
      setLoading(true);
      const stored = JSON.parse(localStorage.getItem("auth_data") || "{}");
      const accessToken = stored?.accessToken;
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/employee/${id}`, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        // Object.entries(data.data).forEach(([k, v]) =>
        //   setValue(k as keyof IEmployee, v),
        // );
        setValue("title", data.data.title);
        setExistingImage(data.data.single_image);
        setExistingImages(data.data.multiple_image || []); // array of paths
        if (data?.data?.title) {
          const date = new Date(data.data.DOB);
          setValue("DOB", date.toISOString().split("T")[0]);
        }
      } catch (error: any) {
        setMsg(
          error?.response?.data?.message ||
            error?.message ||
            "Something went wrong",
        );
        setMsgType("danger");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IEmployee>({
    resolver: yupResolver(mode == "edit" ? editSchema : schema),
    defaultValues: {},
  });
  // const formValues = watch();
  // console.log(formValues);

  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => {
        setMsg("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);
  const onSubmit = async (data: IEmployee) => {
    setLoading(true);
    try {
      const stored = JSON.parse(localStorage.getItem("auth_data") || "{}");
      const accessToken = stored?.accessToken;
      const header = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
      };

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append(
        "DOB",
        typeof data.DOB === "string"
          ? data.DOB
          : new Date(data.DOB).toISOString().split("T")[0],
      );

      if (data.single_image) {
        formData.append("single_image", data.single_image);
      }
      if (mode === "edit") {
        formData.append("existingImages", JSON.stringify(existingImages));
      }

      if (data.multiple_image?.length) {
        data.multiple_image.forEach((file) => {
          formData.append("multiple_image", file);
        });
      }
      let res: any;
      if (mode === "add") {
        res = await axios.post(`${BACKEND_URL}/api/employee`, formData, header);
      } else {
        res = await axios.put(
          `${BACKEND_URL}/api/employee/${id}`,
          formData,
          header,
        );
      }

      navigate("/employee/list", {
        state: { msg: res.data.message, type: "success" },
      });
    } catch (error: any) {
      setMsg(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong",
      );
      setMsgType("danger");
      window.scrollTo({ top: 0, behavior: "smooth" });

      requestAnimationFrame(() => {
        topRef.current?.focus();
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center mt-5">
      <Card style={{ width: "500px" }}>
        <Card.Body>
          <Card.Title className="text-center mb-4" ref={topRef}>
            Employee
          </Card.Title>

          {msg && (
            <Alert
              variant={msgType === "success" ? "success" : "danger"}
              className="text-center"
            >
              {msg}
            </Alert>
          )}

          <Form
            onSubmit={handleSubmit(onSubmit)}
            className={loading ? "opacity-50" : ""}
          >
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                autoFocus
                type="text"
                placeholder="Title"
                {...register("title")}
                isInvalid={!!errors.title}
              />
              <Form.Control.Feedback type="invalid">
                {errors.title?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group>
              <Form.Label>Upload single_image</Form.Label>
              <Form.Control
                type="file"
                accept=".jpg,.jpeg,.png"
                isInvalid={!!errors.single_image}
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    setValue("single_image", file); // File object
                    setPreview(URL.createObjectURL(file)); // Preview
                  }
                }}
              />
              <Form.Control.Feedback type="invalid">
                {errors.single_image?.message}
              </Form.Control.Feedback>
            </Form.Group>
            {preview ? (
              <img src={preview} width={150} height={150} alt="preview" />
            ) : existingImage ? (
              <img
                src={`${BACKEND_URL}/${existingImage}`}
                width={150}
                height={150}
                alt="profile"
              />
            ) : null}
            <Form.Control
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              isInvalid={!!errors.multiple_image}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setValue("multiple_image", files);

                const previews = files.map((file) => URL.createObjectURL(file));
                setNewImagesPreview(previews);
              }}
            />
            <div className="d-flex gap-2 flex-wrap">
              {/* 🆕 SHOW NEW IMAGES IF SELECTED */}
              {existingImages.map((img, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={`${BACKEND_URL}/${img}`} width="120" />

                  <Button
                    size="sm"
                    variant="danger"
                    style={{ position: "absolute", top: 0, right: 0 }}
                    onClick={() => handleRemoveExisting(img)}
                  >
                    ✖
                  </Button>
                </div>
              ))}
              {newImagesPreview.length > 0 &&
                newImagesPreview.map((src, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={src} width="120" />

                    <Button
                      size="sm"
                      variant="danger"
                      style={{ position: "absolute", top: 0, right: 0 }}
                      onClick={() => handleRemoveNew(i)}
                    >
                      ✖
                    </Button>
                  </div>
                ))}

              {/* 📦 ELSE SHOW EXISTING IMAGES */}
              {newImagesPreview.length === 0 &&
                existingImages.map((img, i) => (
                  <img key={i} src={`${BACKEND_URL}/${img}`} width="120" />
                ))}
            </div>
            <Form.Group>
              <Form.Label>Select Date</Form.Label>
              <Form.Control
                type="date"
                {...register("DOB")}
                isInvalid={!!errors.DOB}
              />
              <Form.Control.Feedback type="invalid">
                {errors.DOB?.message}
              </Form.Control.Feedback>
            </Form.Group>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>

              <Button
                variant="secondary"
                onClick={() => navigate(`/employee/list`)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
export default EmployeeAdd;
