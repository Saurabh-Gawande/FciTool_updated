import React, { useEffect, useState } from "react";
import Sidenav from "./sidenav";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./Monthly_sol.css";
import config from "../../config";
// import "bootstrap/dist/css/bootstrap.min.css";

function Monthly_Solution() {
  const ProjectIp = config.serverUrl;
  const portalUrl = config.portalUrl;

  const [fileSelected, setFileSelected] = useState(false);
  const [importedFile1, setImportedFile1] = useState(null);
  const [importedFile2, setImportedFile2] = useState(null);
  const [TEFD, set_TEFD] = useState("");
  const [type, set_type] = useState("");
  const [solutionSolved, setSolutionSolved] = useState(false);
  const [Relevant_result, set_Relevant_Result] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [commodiyCountData, setCommodityCountData] = useState([]);
  const [monthlyDataCollection, setMonthlyDataCollection] = useState([]);
  const [stateRestrictionList, setStateRestrictionList] = useState([]);

  const handleFileChange = (e) => {
    setFileSelected(e.target.files[0]);
  };

  //for import the data
  const ImportData = () => {
    try {
      fetch(`${portalUrl}/ToolOptimizerWebApi/MonthlyPlanforTool?status=Inward`)
        .then((res) => res.blob())
        .then(async (blob) => {
          const excelFile = new File([blob], "MonthlyPlanforTool.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          setImportedFile1(excelFile);
          setShowMessage(true);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });

      fetch(
        `${portalUrl}/ToolOptimizerWebApi/MonthlyPlanforTool?status=Outward`
      )
        .then((res) => res.blob())
        .then(async (blob) => {
          const excelFile = new File([blob], "MonthlyPlanforTool.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          setImportedFile2(excelFile);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
      set_type("Imported");

      fetch(
        `${portalUrl}/MonthlyDataCollectionWebApi/GetCommodityCountData/Rail`
      )
        .then((res) => res.json())
        .then((data) => setCommodityCountData(data));

      fetch(
        `${portalUrl}/MonthlyDataCollectionWebApi/GetAllRegionData/excel/Rail`
      )
        .then((res) => res.json())
        .then((data) => setMonthlyDataCollection(data));

      fetch(`${portalUrl}/ToolOptimizerWebApi/StateRestrictionList`)
        .then((res) => res.json())
        .then((data) => setStateRestrictionList(data));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  console.log(stateRestrictionList);
  useEffect(() => {
    if (importedFile1) {
      const uploadFile = async () => {
        try {
          const formData1 = new FormData();
          formData1.append("uploadFile1", importedFile1);

          const response1 = await fetch(
            ProjectIp + "/Import_Monthly_File_Invard",
            {
              method: "POST",
              credentials: "include",
              body: formData1,
            }
          );

          if (!response1.ok) {
            throw new Error("Network response was not ok");
          }
        } catch (error) {
          console.error("Error during file upload:", error);
          alert(
            "An error occurred during file upload. Please try again later."
          );
        }
      };
      uploadFile();
    }
  }, [importedFile1]);

  useEffect(() => {
    if (importedFile2) {
      const uploadFile = async () => {
        try {
          const formData2 = new FormData();
          formData2.append("uploadFile2", importedFile2);

          const response2 = await fetch(
            ProjectIp + "/Import_Monthly_File_Outward",
            {
              method: "POST",
              credentials: "include",
              body: formData2,
            }
          );

          if (!response2.ok) {
            throw new Error("Network response was not ok");
          }

          const jsonResponse2 = await response2.json();

          if (jsonResponse2.status === 1) {
            document.getElementById("console_").style.display = "block";
            document.getElementById("console_").innerHTML +=
              "Data imported successfully" + "<br/><br/>";

            alert("Data imported successfully");
          } else {
            alert("Error uploading file");
          }
        } catch (error) {
          console.error("Error during file upload:", error);
          alert(
            "An error occurred during file upload. Please try again later."
          );
        }
      };
      uploadFile();
    }
  }, [importedFile2]);

  // for uploading the data to the server
  const handleUploadConfig = async () => {
    if (!fileSelected) {
      alert("Please Select The File First");
      return;
    }
    try {
      set_type("Uploaded");
      const formData = new FormData();
      formData.append("uploadFile", fileSelected);

      const response = await fetch(ProjectIp + "/upload_Monthly_File", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const jsonResponse = await response.json();

      if (jsonResponse.status === 1) {
        document.getElementById("console_").style.display = "block";
        document.getElementById("console_").innerHTML +=
          "Template file has been uploaded" + "<br/><br/>";

        alert("File Uploaded");
      } else {
        alert("Error uploading file");
      }
    } catch (error) {
      console.error("Error during file upload:", error);
      alert("An error occurred during file upload. Please try again later.");
    }
  };

  // function for solving the monthly planner problem
  const handleSolve = async () => {
    document.getElementById("toggle").checked = true;
    if (isLoading) return;
    setIsLoading(true);
    document.getElementById("console_").style.display = "block";
    document.getElementById("console_").innerHTML += "Processing..." + "<br/>";
    const payload = {
      TEFD: TEFD,
      type: type,
      stateRestrictionList,
    };

    try {
      const response = await fetch(ProjectIp + "/Monthly_Movement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      // fetchReservationId_Revelant_result();
      if (response.ok) {
        alert("Solution Done!, Now you can download results");
        setSolutionSolved(true);
        setIsLoading(false);
        document.getElementById("toggle").checked = false;
        document.getElementById("console_").innerHTML +=
          "Solution has been done" +
          "<br/> " +
          "Click on download RH to RH Detailed plan" +
          "<br/>";
      } else {
        console.error("Failed to send inputs. Status code:", response.status);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error sending inputs:", error);
    } finally {
      // Reset loading state
      console.log("null");
      setIsLoading(false);
    }
  };

  // const fetchReservationId_Revelant_result = () => {
  //   fetch(ProjectIp + "/read_Relevant_Result", {
  //     method: "GET",
  //     credentials: "include",
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       const fetched_Relevant_Result = data;
  //       set_Relevant_Result(fetched_Relevant_Result);
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //     });
  // };

  const ExportPlan = () => {
    fetch(ProjectIp + "/MonthlyDataSend", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        // Check if the response is OK (status code 200-299)
        if (response.ok) {
          return response.json(); // Parse the response as JSON
        } else {
          throw new Error("File upload failed. Please try again.");
        }
      })
      .then((data) => {
        // Handle the success response here
        alert("File uploaded successfully!");
        console.log(data); // Optional: log the response data
      })
      .catch((error) => {
        console.error("An error occurred during the file upload:", error);
        alert("File upload failed. Please try again.");
      });
  };

  // const exportToExcel2 = async () => {
  //   if (Relevant_result === null) {
  //     window.alert("Fetching Result, Please Wait");
  //     fetchReservationId_Revelant_result();
  //   } else {
  //     const workbook = XLSX.utils.book_new();
  //     Object.entries(Relevant_result).forEach(([column, data]) => {
  //       const parsedData = JSON.parse(data);
  //       const worksheet = XLSX.utils.json_to_sheet(parsedData);
  //       XLSX.utils.book_append_sheet(workbook, worksheet, column);
  //     });
  //     const excelBuffer = XLSX.write(workbook, {
  //       type: "array",
  //       bookType: "xlsx",
  //     });
  //     const excelBlob = new Blob([excelBuffer], {
  //       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //     });
  //     saveAs(excelBlob, "Monthly_Movement_results.xlsx");
  //   }
  // };

  const getRowColor = (inward, outward) => {
    if (outward >= inward) {
      return "table-success";
    } else if (inward > outward) {
      return "table-danger";
    } else {
      return "";
    }
  };

  return (
    <div
      className="page-container"
      style={{ backgroundColor: "#ebab44b0", minHeight: "100vh" }}
    >
      <Sidenav />
      <div
        className="page-content"
        style={{
          display: "flex",
          backgroundImage: "url('static/img/bg8.jpg')",
          minHeight: "100vh",
        }}
      >
        <div>
          <ul
            className="x-navigation x-navigation-horizontal x-navigation-panel"
            style={{ backgroundColor: "rgba(235, 171, 68, 0.69)" }}
          >
            <li className="xn-icon-button">
              <a href="#" className="x-navigation-minimize">
                <span className="fa fa-dedent" />
              </a>
            </li>
            <li
              className="xn-logo"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "90%",
              }}
            >
              <span style={{ color: "black", fontSize: "32px" }}>
                Optimized Monthly Plan
              </span>
              <a className="x-navigation-control"></a>
            </li>
          </ul>

          <ul className="breadcrumb">
            <li>
              <a href="/home">Home</a>
            </li>
            <li className="active">Monthly plan</li>
            <li className="active">v12.10</li>
          </ul>

          <div className="page-content-wrap">
            <div className="row">
              <br />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "45vw",
                }}
              ></div>
              <div className="col-md-12">
                <br />
                <div className="row" style={{ marginLeft: "15px" }}>
                  <div
                    style={{
                      color: "white",
                      display: "flex",
                      width: "62vw",
                      justifyContent: "end",
                    }}
                  >
                    <button
                      className="btn btn-danger dropdown-toggle"
                      onClick={ImportData}
                    >
                      Import data
                    </button>
                  </div>
                  {/* <div style={{ fontSize: "20px", fontWeight: "700" }}>
                    <i className="fa fa-file-excel-o" aria-hidden="true"></i>{" "}
                    Template
                  </div> */}
                  {/* <form
                    action=""
                    encType="multipart/form-data"
                    id="uploadForm"
                    className="form-horizontal"
                  >
                    <div
                      className="col-md-6"
                      style={{ marginTop: "15px", marginLeft: "50px" }}
                    >
                      <div className="form-group">
                        <div className="col-md-9">
                          <div className="input-group">
                            <span
                              className="input-group-addon"
                              style={{
                                backgroundColor: "rgba(235, 171, 68, 0.69)",
                              }}
                            >
                              <span className="fa fa-info" />
                            </span>
                            <input
                              type="file"
                              className="form-control"
                              id="uploadFile"
                              name="uploadFile"
                              onChange={handleFileChange}
                              defaultValue=""
                              required
                            />
                          </div>
                          <span
                            className="help-block"
                            style={{ color: "black" }}
                          >
                            Choose Data Template
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <img
                        className="upload_class"
                        src={background1}
                        id="uploadConfig"
                        onClick={handleUploadConfig}
                        disabled={!fileSelected}
                      />
                      <div style={{ marginTop: "-25px" }}>Click here</div>
                    </div>
                  </form> */}
                </div>
                <br />
                <div style={{ marginLeft: "15px" }}>
                  {/* <div style={{ fontSize: "20px", fontWeight: "700" }}>
                    <i className="fa fa-info-circle" aria-hidden="true"></i>{" "}
                    Configurations
                  </div> */}
                  {/* <br /> */}
                  {/* <form style={{ marginLeft: "50px" }}>
                    <label>
                      <strong
                        style={{
                          fontSize: "20px",
                          marginLeft: "15px",
                          color: "#9d0921",
                        }}
                      >
                        Select Matrix System
                      </strong>
                      <select
                        value={TEFD}
                        onChange={(e) => {
                          set_TEFD(e.target.value);
                          document.getElementById("console_").style.display =
                            "block";
                          document.getElementById("console_").innerHTML +=
                            "You have selected the matrix system as " +
                            e.target.value +
                            "<br/><br/>";
                        }}
                        style={{ marginLeft: "547px" }}
                      >
                        <option value="">Select Matrix System</option>
                        <option value="NON-TEFD">Non-TEFD</option>
                        <option value="TEFD">TEFD</option>
                        <option value="Non-TEFD+TC">Non-TEFD + TC</option>
                        <option value="TEFD+TC">TEFD + TC</option>
                      </select>
                    </label>
                    <br />
                  </form> */}
                  {showMessage && (
                    <div className="container mt-5">
                      <div className="row">
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered">
                            <thead>
                              <tr>
                                <th>Commodity</th>
                                <th>State</th>
                                <th>Inward</th>
                                <th>Outward</th>
                                <th>Surplus</th>
                              </tr>
                            </thead>
                            <tbody>
                              {commodiyCountData.slice(2).map((item, index) => (
                                <tr
                                  key={index}
                                  className={getRowColor(
                                    item.inward,
                                    item.outward
                                  )}
                                >
                                  <td>{item.commodity}</td>
                                  <td>{item.state}</td>
                                  <td>{item.inward}</td>
                                  <td>{item.outward}</td>
                                  <td>{item.surplus}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {showMessage && (
                    <div className="container mt-5">
                      <h2>Region Data</h2>
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead>
                            <tr>
                              <th>State</th>
                              {/* <th>Max Run ID</th> */}
                              {/* <th>Inward Wheat URS</th> */}
                              {/* <th>Inward Wheat FAQ</th> */}
                              <th>Inward Wheat Total</th>
                              <th>Inward Rice FRKBR</th>
                              <th>Inward Rice RRA</th>
                              <th>Inward Rice FRKRRA</th>
                              <th>Inward G Total</th>
                              <th>Outward Wheat URS</th>
                              <th>Outward Wheat FAQ</th>
                              <th>Outward Wheat Total</th>
                              <th>Outward Rice FRKBR</th>
                              <th>Outward Rice RRA</th>
                              <th>Outward Rice FRKRRA</th>
                              <th>Outward G Total</th>
                              {/* <th>Created Date</th> */}
                              {/* <th>Last Modified Date</th> */}
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyDataCollection.map((region, index) => (
                              <tr key={index}>
                                <td>{region.state}</td>
                                {/* <td>{region.maxRunId}</td> */}
                                {/* <td>{region.inward_Wheat_URS}</td> */}
                                {/* <td>{region.inward_Wheat_FAQ}</td> */}
                                <td>{region.inward_Wheat_Total}</td>
                                <td>{region.inward_Rice_FRKBR}</td>
                                <td>{region.inward_Rice_RRA}</td>
                                <td>{region.inward_Rice_FRKRRA}</td>
                                <td>{region.inward_G_Total}</td>
                                <td>{region.outward_Wheat_URS}</td>
                                <td>{region.outward_Wheat_FAQ}</td>
                                <td>{region.outward_Wheat_Total}</td>
                                <td>{region.outward_Rice_FRKBR}</td>
                                <td>{region.outward_Rice_RRA}</td>
                                <td>{region.outward_Rice_FRKRRA}</td>
                                <td>{region.outward_G_Total}</td>
                                {/* <td>{region.createdDate}</td> */}
                                {/* <td>{region.lastModifiedDate}</td> */}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: "20px", fontWeight: "700" }}>
                    <i className="fa fa-list-alt" aria-hidden="true"></i>{" "}
                    Optimal Plan
                  </div>
                  <div
                    className="wrap__toggle"
                    style={{
                      textAlign: "center",
                      borderStyle: "solid",
                      borderColor: "#ebab44b0",
                    }}
                  >
                    <div className="wrap__toggle--bluetooth">
                      <span style={{ textAlign: "center", fontWeight: "bold" }}>
                        Generate Optimized Plan
                      </span>
                    </div>
                    <div className="wrap__toggle--toggler">
                      <label htmlFor="toggle">
                        <input
                          type="checkbox"
                          className="checkBox"
                          id="toggle"
                          onChange={handleSolve}
                        />
                        <span></span>
                      </label>
                    </div>
                  </div>
                  <br />
                  <br />
                  {solutionSolved && (
                    <div>
                      <button
                        style={{ color: "black", marginLeft: "15px" }}
                        className="btn btn-success dropdown-toggle"
                        onClick={ExportPlan}
                      >
                        <i className="fa fa-bars"></i>
                        Export plan
                      </button>
                    </div>
                  )}
                  <br />
                </div>
              </div>
            </div>
            <br />
            <br />
          </div>
        </div>
        <div style={{ backgroundColor: "#ebab44b0", width: "29%" }}>
          <br />

          <span style={{ color: "black", fontSize: "32px", marginLeft: "5%" }}>
            Progress Bar
          </span>

          <div
            style={{
              margin: "10px",
              marginLeft: "5%",
              width: "90%",
              border: "2px dashed black",
              paddingTop: "10px",
              paddingLeft: "10px",
              paddingRight: "10px",
              display: "none",
              paddingBottom: "-10px",
            }}
            id="console_"
          ></div>
        </div>
      </div>
    </div>
  );
}

export default Monthly_Solution;
