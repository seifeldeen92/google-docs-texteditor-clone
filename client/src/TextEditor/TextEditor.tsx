import {
  FC,
  useRef,
  MutableRefObject,
  useCallback,
  useEffect,
  useState,
} from "react";
import Quill, { TextChangeHandler } from "quill";
import "quill/dist/quill.snow.css";
import "./TextEditor.css";
import { io, Socket } from "socket.io-client";
import { useParams } from "react-router-dom";
import debounce from "lodash.debounce";
import { useSnackbar } from "react-simple-snackbar";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block", "image"],
  // [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }],
  // [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  // [{ direction: "rtl" }], // text direction
  // [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],
  ["clean"],
];

const SERVER_URL = "http://localhost:5000";
const DEBOUNCE_SAVE_DELAY_MS = 1500;
const SNACKBAR_DISMISS_MS = 1500;

const TextEditor: FC = () => {
  const [socketInstance, setSocketInstance] = useState<Socket>();
  const [quillInstance, setQuillInstance] = useState<Quill>();
  const qlEditorContainerRef = useRef<HTMLDivElement>(null);
  const { id: docId } = useParams<{ id: string }>();
  const [openSnackbar] = useSnackbar();
  // Init our Socket
  useEffect(() => {
    const s = io(SERVER_URL);
    setSocketInstance(s);
    return () => {
      s.disconnect();
    };
  }, []);

  const debouncedDocSave = useCallback(
    debounce(async () => {
      await socketInstance?.emit("save-document", quillInstance?.getContents());
      openSnackbar("Saved", SNACKBAR_DISMISS_MS);
    }, DEBOUNCE_SAVE_DELAY_MS),
    [socketInstance]
  );

  // Send doc changes to the server
  useEffect(() => {
    const textChangeHandler: TextChangeHandler = async (
      delta,
      oldDelta,
      source
    ) => {
      if (source !== "user") return;
      await socketInstance?.emit("send-delta", delta);
      debouncedDocSave();
    };
    quillInstance?.on("text-change", textChangeHandler);
    return () => {
      quillInstance?.off("text-change", textChangeHandler);
    };
  }, [quillInstance, socketInstance]);

  // Receive from the server and update the doc
  useEffect(() => {
    const receiveChanges: TextChangeHandler = (delta) => {
      quillInstance?.updateContents(delta);
    };
    socketInstance?.on("receive-delta-changes", receiveChanges);
    return () => {
      socketInstance?.off("receive-delta-changes", receiveChanges);
    };
  }, [quillInstance, socketInstance]);

  // load doc
  useEffect(() => {
    const loadDocument = (document: any) => {
      quillInstance?.setContents(document);
      quillInstance?.enable();
    };
    socketInstance?.once("load-document", loadDocument);

    socketInstance?.emit("fetch-document-with-id", docId);
  }, [quillInstance, socketInstance, docId]);
  return (
    <div
      className="ql-editor-container"
      ref={useCallback((qlEditorContainer: HTMLDivElement) => {
        (qlEditorContainerRef as MutableRefObject<HTMLDivElement>).current = qlEditorContainer;
        if (qlEditorContainer == null) return;
        qlEditorContainerRef.current!.innerHTML = "";
        const qlEditor = document.createElement("div");
        qlEditorContainerRef.current!.append(qlEditor);
        const q = new Quill(qlEditor, {
          modules: { toolbar: TOOLBAR_OPTIONS },
          theme: "snow",
        });
        quillInstance?.disable();
        setQuillInstance(q);
      }, [])}
    />
  );
};

export default TextEditor;
