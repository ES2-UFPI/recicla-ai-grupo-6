--
-- PostgreSQL database dump
--

\restrict 93aWBENM13IhErt0tFvt6DXKIWQZKCEuLD1sdRgj5dbe2lL0hNM9MT8UgxCnzAt

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-10-12 20:43:14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 22189)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5763 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 23283)
-- Name: coletor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coletor (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    senha character varying(255) NOT NULL,
    telefone character varying(20),
    cpf character varying(14) NOT NULL,
    cep character varying(9),
    cidade character varying(100),
    estado character(2),
    geom public.geometry(Point,4326)
);


ALTER TABLE public.coletor OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 23282)
-- Name: coletor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coletor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coletor_id_seq OWNER TO postgres;

--
-- TOC entry 5764 (class 0 OID 0)
-- Dependencies: 225
-- Name: coletor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coletor_id_seq OWNED BY public.coletor.id;


--
-- TOC entry 228 (class 1259 OID 23296)
-- Name: cooperativa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cooperativa (
    id integer NOT NULL,
    nome_empresa character varying(150) NOT NULL,
    email character varying(100) NOT NULL,
    senha character varying(255) NOT NULL,
    telefone character varying(20),
    cnpj character varying(18) NOT NULL,
    cep character varying(9),
    rua character varying(150),
    numero character varying(10),
    bairro character varying(100),
    cidade character varying(100),
    estado character(2),
    geom public.geometry(Point,4326)
);


ALTER TABLE public.cooperativa OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 23295)
-- Name: cooperativa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cooperativa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cooperativa_id_seq OWNER TO postgres;

--
-- TOC entry 5765 (class 0 OID 0)
-- Dependencies: 227
-- Name: cooperativa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cooperativa_id_seq OWNED BY public.cooperativa.id;


--
-- TOC entry 224 (class 1259 OID 23270)
-- Name: produtor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produtor (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    senha character varying(255) NOT NULL,
    telefone character varying(20),
    cpf character varying(14) NOT NULL,
    cep character varying(9),
    rua character varying(150),
    numero character varying(10),
    bairro character varying(100),
    cidade character varying(100),
    estado character(2),
    geom public.geometry(Point,4326)
);


ALTER TABLE public.produtor OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 23269)
-- Name: produtor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.produtor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.produtor_id_seq OWNER TO postgres;

--
-- TOC entry 5766 (class 0 OID 0)
-- Dependencies: 223
-- Name: produtor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.produtor_id_seq OWNED BY public.produtor.id;


--
-- TOC entry 230 (class 1259 OID 23309)
-- Name: solicitacao_coleta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitacao_coleta (
    id integer NOT NULL,
    produtor_id integer NOT NULL,
    coletor_id integer,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_inicio_coleta date NOT NULL,
    data_fim_coleta date NOT NULL,
    horario_inicio time without time zone,
    horario_fim time without time zone,
    status character varying(20) DEFAULT 'SOLICITADA'::character varying NOT NULL,
    CONSTRAINT solicitacao_coleta_status_check CHECK (((status)::text = ANY ((ARRAY['SOLICITADA'::character varying, 'ACEITA'::character varying, 'CANCELADA'::character varying, 'CONFIRMADA'::character varying])::text[])))
);


ALTER TABLE public.solicitacao_coleta OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 23308)
-- Name: solicitacao_coleta_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.solicitacao_coleta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.solicitacao_coleta_id_seq OWNER TO postgres;

--
-- TOC entry 5767 (class 0 OID 0)
-- Dependencies: 229
-- Name: solicitacao_coleta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.solicitacao_coleta_id_seq OWNED BY public.solicitacao_coleta.id;


--
-- TOC entry 5569 (class 2604 OID 23286)
-- Name: coletor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coletor ALTER COLUMN id SET DEFAULT nextval('public.coletor_id_seq'::regclass);


--
-- TOC entry 5570 (class 2604 OID 23299)
-- Name: cooperativa id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cooperativa ALTER COLUMN id SET DEFAULT nextval('public.cooperativa_id_seq'::regclass);


--
-- TOC entry 5568 (class 2604 OID 23273)
-- Name: produtor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtor ALTER COLUMN id SET DEFAULT nextval('public.produtor_id_seq'::regclass);


--
-- TOC entry 5571 (class 2604 OID 23312)
-- Name: solicitacao_coleta id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitacao_coleta ALTER COLUMN id SET DEFAULT nextval('public.solicitacao_coleta_id_seq'::regclass);


--
-- TOC entry 5753 (class 0 OID 23283)
-- Dependencies: 226
-- Data for Name: coletor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coletor (id, nome, email, senha, telefone, cpf, cep, cidade, estado, geom) FROM stdin;
\.


--
-- TOC entry 5755 (class 0 OID 23296)
-- Dependencies: 228
-- Data for Name: cooperativa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cooperativa (id, nome_empresa, email, senha, telefone, cnpj, cep, rua, numero, bairro, cidade, estado, geom) FROM stdin;
\.


--
-- TOC entry 5751 (class 0 OID 23270)
-- Dependencies: 224
-- Data for Name: produtor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.produtor (id, nome, email, senha, telefone, cpf, cep, rua, numero, bairro, cidade, estado, geom) FROM stdin;
\.


--
-- TOC entry 5757 (class 0 OID 23309)
-- Dependencies: 230
-- Data for Name: solicitacao_coleta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitacao_coleta (id, produtor_id, coletor_id, data_criacao, data_inicio_coleta, data_fim_coleta, horario_inicio, horario_fim, status) FROM stdin;
\.


--
-- TOC entry 5567 (class 0 OID 22511)
-- Dependencies: 219
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 5768 (class 0 OID 0)
-- Dependencies: 225
-- Name: coletor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coletor_id_seq', 1, false);


--
-- TOC entry 5769 (class 0 OID 0)
-- Dependencies: 227
-- Name: cooperativa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cooperativa_id_seq', 1, false);


--
-- TOC entry 5770 (class 0 OID 0)
-- Dependencies: 223
-- Name: produtor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.produtor_id_seq', 1, false);


--
-- TOC entry 5771 (class 0 OID 0)
-- Dependencies: 229
-- Name: solicitacao_coleta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitacao_coleta_id_seq', 1, false);


--
-- TOC entry 5585 (class 2606 OID 23294)
-- Name: coletor coletor_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coletor
    ADD CONSTRAINT coletor_cpf_key UNIQUE (cpf);


--
-- TOC entry 5587 (class 2606 OID 23292)
-- Name: coletor coletor_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coletor
    ADD CONSTRAINT coletor_email_key UNIQUE (email);


--
-- TOC entry 5589 (class 2606 OID 23290)
-- Name: coletor coletor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coletor
    ADD CONSTRAINT coletor_pkey PRIMARY KEY (id);


--
-- TOC entry 5591 (class 2606 OID 23307)
-- Name: cooperativa cooperativa_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cooperativa
    ADD CONSTRAINT cooperativa_cnpj_key UNIQUE (cnpj);


--
-- TOC entry 5593 (class 2606 OID 23305)
-- Name: cooperativa cooperativa_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cooperativa
    ADD CONSTRAINT cooperativa_email_key UNIQUE (email);


--
-- TOC entry 5595 (class 2606 OID 23303)
-- Name: cooperativa cooperativa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cooperativa
    ADD CONSTRAINT cooperativa_pkey PRIMARY KEY (id);


--
-- TOC entry 5579 (class 2606 OID 23281)
-- Name: produtor produtor_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtor
    ADD CONSTRAINT produtor_cpf_key UNIQUE (cpf);


--
-- TOC entry 5581 (class 2606 OID 23279)
-- Name: produtor produtor_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtor
    ADD CONSTRAINT produtor_email_key UNIQUE (email);


--
-- TOC entry 5583 (class 2606 OID 23277)
-- Name: produtor produtor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtor
    ADD CONSTRAINT produtor_pkey PRIMARY KEY (id);


--
-- TOC entry 5597 (class 2606 OID 23317)
-- Name: solicitacao_coleta solicitacao_coleta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitacao_coleta
    ADD CONSTRAINT solicitacao_coleta_pkey PRIMARY KEY (id);


--
-- TOC entry 5598 (class 2606 OID 23323)
-- Name: solicitacao_coleta solicitacao_coleta_coletor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitacao_coleta
    ADD CONSTRAINT solicitacao_coleta_coletor_id_fkey FOREIGN KEY (coletor_id) REFERENCES public.coletor(id);


--
-- TOC entry 5599 (class 2606 OID 23318)
-- Name: solicitacao_coleta solicitacao_coleta_produtor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitacao_coleta
    ADD CONSTRAINT solicitacao_coleta_produtor_id_fkey FOREIGN KEY (produtor_id) REFERENCES public.produtor(id);


-- Completed on 2025-10-12 20:43:15

--
-- PostgreSQL database dump complete
--

\unrestrict 93aWBENM13IhErt0tFvt6DXKIWQZKCEuLD1sdRgj5dbe2lL0hNM9MT8UgxCnzAt

