import {
  FormField,
  CourseProgramField,
  PhilippineMobile,
  TagSelector,
  CheckGroup,
  RepeatableSection,
  ErrorMessage,
} from "./Fields.jsx"

import { yearLevels } from "../../data/educationOptions.js"

export const stepKeys = [
  "personal",

  "education",

  "skills",

  "work_experience",

  "preferences",
]

export const stepNames = [
  "Personal",

  "Education",

  "Skills",

  "Experience",

  "Preferences",
]

export const stepTitles = [
  "Personal Information",

  "Education",

  "Skills & Qualifications",

  "Work Experience",

  "What kind of work are you looking for?",
]

export const stepDescriptions = [
  "Tell us a little about yourself so PESO can maintain an accurate jobseeker profile.",

  "Your education helps describe which job qualifications may fit your background, including studies you are still completing.",

  "Add skills and qualifications that can later help PesoMatch compare your profile with job requirements.",

  "Your experience can help describe suitable roles. First-time jobseekers can also complete this section.",

  "Your preferred roles, locations and work arrangements guide the opportunities you want to explore. You can update them anytime.",
]

export const defaults = {
  personal: {
    first_name: "",

    middle_name: "",

    last_name: "",

    birth_date: "",

    sex: "",

    mobile_number: "",

    address_line: "",

    province: "",

    municipality: "",

    barangay: "",
  },

  education: {
    highest_attainment: "",

    school_name: "",

    course_program: "",

    year_graduated: "",

    year_level: "",

    educational_status: "",
  },

  skills: { skills: [], certifications: [], languages: [], licenses: [] },

  work_experience: { has_experience: null, experiences: [] },

  preferences: {
    occupations: [],

    preferred_industry: "",

    preferred_location: "",

    employment_types: [],

    work_arrangements: [],

    willing_to_relocate: false,
  },
}

export function mergeSaved(data = {}) {
  return Object.fromEntries(
    stepKeys.map((key) => [
      key,

      { ...structuredClone(defaults[key]), ...(data[key] || {}) },
    ]),
  )
}

const required = (errors, data, keys) =>
  keys.forEach((key) => {
    if (data[key] == null || String(data[key]).trim() === "")
      errors[key] = "This field is required."
  })

export function validateStep(step, data) {
  const errors = {}

  if (step === 1) {
    required(errors, data, [
      "first_name",

      "last_name",

      "birth_date",

      "mobile_number",

      "address_line",

      "province",

      "municipality",

      "barangay",
    ])

    if (
      data.birth_date &&
      new Date(`${data.birth_date}T00:00:00`) >=
        new Date(new Date().setHours(0, 0, 0, 0))
    )
      errors.birth_date = "Enter a birth date before today."

    if (data.mobile_number && !/^\+639\d{9}$/.test(data.mobile_number))
      errors.mobile_number =
        "Enter a valid Philippine mobile number: 10 digits starting with 9."
  }

  if (step === 2) {
    if (data.year_level && !yearLevels.includes(data.year_level))
      errors.year_level = "Choose a year level from 1st through 5+."

    required(errors, data, [
      "highest_attainment",

      "school_name",

      "educational_status",
    ])

    if (
      data.year_graduated &&
      (!/^\d{4}$/.test(String(data.year_graduated)) ||
        Number(data.year_graduated) > new Date().getFullYear() ||
        Number(data.year_graduated) < 1900)
    )
      errors.year_graduated = "Enter a year between 1900 and the current year."
  }

  if (step === 3) {
    if (!data.skills.length) errors.skills = "Select at least one skill."

    const rowRequired = {
      certifications: ["certification_name"],

      languages: ["language", "proficiency"],

      licenses: ["license_name"],
    }

    Object.entries(rowRequired).forEach(([section, keys]) =>
      data[section].forEach((item, index) =>
        keys.forEach((key) => {
          if (!String(item[key] || "").trim())
            errors[`${section}.${index}.${key}`] =
              "Complete this field or remove this entry."
        }),
      ),
    )
  }

  if (step === 4) {
    if (data.has_experience == null)
      errors.has_experience = "Choose Yes or No to continue."

    if (data.has_experience && !data.experiences.length)
      errors.experiences = "Add at least one experience, or choose No."

    if (data.has_experience)
      data.experiences.forEach((item, index) => {
        ;["job_title", "company_name", "start_date"].forEach((key) => {
          if (!String(item[key] || "").trim())
            errors[`experiences.${index}.${key}`] = "This field is required."
        })

        if (!item.is_current && !item.end_date)
          errors[`experiences.${index}.end_date`] =
            "Add an end date, or select I currently work here."

        if (
          !item.is_current &&
          item.start_date &&
          item.end_date &&
          item.end_date < item.start_date
        )
          errors[`experiences.${index}.end_date`] =
            "End date must be on or after the start date."
      })
  }

  if (step === 5) {
    required(errors, data, ["preferred_location"])

    if (!data.occupations.length)
      errors.occupations = "Add at least one preferred occupation."

    if (!data.employment_types.length)
      errors.employment_types = "Choose at least one employment type."

    if (!data.work_arrangements.length)
      errors.work_arrangements = "Choose at least one work arrangement."
  }

  return errors
}

export function PersonalStep({ data, update, errors }) {
  const bind = (name) => ({
    value: data[name] ?? "",

    error: errors[name],

    onChange: (event) => update(name, event.target.value),

    name,
  })

  const yesterday = new Date()

  yesterday.setDate(yesterday.getDate() - 1)

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField
        label="First Name"
        required
        autoComplete="given-name"
        maxLength={100}
        {...bind("first_name")}
      />
      <FormField
        label="Last Name"
        required
        autoComplete="family-name"
        maxLength={100}
        {...bind("last_name")}
      />
      <FormField
        label="Middle Name (optional)"
        autoComplete="additional-name"
        maxLength={100}
        {...bind("middle_name")}
      />
      <FormField
        label="Birth Date"
        type="date"
        required
        autoComplete="bday"
        max={yesterday.toLocaleDateString("en-CA")}
        {...bind("birth_date")}
      />
      <FormField
        label="Sex (optional)"
        options={["Female", "Male", "Prefer not to say", "Other"]}
        {...bind("sex")}
      />
      <PhilippineMobile
        value={data.mobile_number || ""}
        onChange={(value) => update("mobile_number", value)}
        error={errors.mobile_number}
      />
      <div className="sm:col-span-2">
        <FormField
          label="Address"
          required
          autoComplete="street-address"
          maxLength={255}
          helper="House or building number, street, and subdivision, if applicable."
          {...bind("address_line")}
        />
      </div>
      <FormField
        label="Province"
        required
        autoComplete="address-level1"
        maxLength={100}
        {...bind("province")}
      />
      <FormField
        label="Municipality / City"
        required
        autoComplete="address-level2"
        maxLength={100}
        {...bind("municipality")}
      />
      <FormField
        label="Barangay"
        required
        autoComplete="address-level3"
        maxLength={100}
        {...bind("barangay")}
      />
    </div>
  )
}

export function EducationStep({ data, update, errors }) {
  const bind = (name) => ({
    value: data[name] ?? "",

    error: errors[name],

    onChange: (event) => update(name, event.target.value),

    name,
  })

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField
        label="Highest Educational Attainment"
        required
        options={[
          "Senior High School",

          "Vocational / TESDA",

          "College Level",

          "College Graduate",

          "Postgraduate",
        ]}
        {...bind("highest_attainment")}
      />
      <FormField
        label="Educational Status"
        required
        options={[
          "Currently Studying",

          "Graduated",

          "Undergraduate",

          "Vocational Graduate",

          "Other",
        ]}
        {...bind("educational_status")}
        onChange={(event) => {
          update("educational_status", event.target.value)

          if (event.target.value === "Currently Studying")
            update("year_graduated", "")
        }}
      />
      <div className="sm:col-span-2">
        <FormField
          label="School / Institution"
          required
          maxLength={255}
          {...bind("school_name")}
        />
      </div>
      <CourseProgramField
        value={data.course_program}
        error={errors.course_program}
        onChange={(value) => update("course_program", value)}
      />
      <FormField
        label="Year Level (optional)"
        options={yearLevels}
        helper="Your current or most recent year level."
        {...bind("year_level")}
      />
      <FormField
        label="Year Graduated (optional)"
        options={[
          { value: "not_graduated", label: "Not yet graduated" },

          ...Array.from(
            { length: new Date().getFullYear() - 1899 },

            (_, index) => String(new Date().getFullYear() - index),
          ),
        ]}
        disabled={data.educational_status === "Currently Studying"}
        helper={
          data.educational_status === "Currently Studying"
            ? "No graduation year needed while you are studying."
            : "Select Not yet graduated if you have not finished."
        }
        {...bind("year_graduated")}
        value={
          data.year_graduated ? String(data.year_graduated) : "not_graduated"
        }
        onChange={(event) =>
          update(
            "year_graduated",

            event.target.value === "not_graduated" ? "" : event.target.value,
          )
        }
      />
    </div>
  )
}

const newItem = (fields) => ({ ...fields, _key: crypto.randomUUID() })

export const experienceTemplate = () =>
  newItem({
    job_title: "",

    company_name: "",

    industry: "",

    employment_type: "",

    start_date: "",

    end_date: "",

    is_current: false,

    description: "",
  })

export function SkillsStep({ data, update, errors, options, notify }) {
  const updateRow = (section, index, field, value) =>
    update(section, (latest) =>
      latest.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    )

  const remove = (section, index, label) => {
    const removed = data[section][index]

    update(section, (latest) => latest.filter((_, i) => i !== index))

    notify(`${label} removed.`, {
      undo: () =>
        update(section, (latest) => [
          ...latest.slice(0, index),

          removed,

          ...latest.slice(index),
        ]),
    })
  }

  const rowBind = (section, index, field) => ({
    value: data[section][index][field] ?? "",

    error: errors[`${section}.${index}.${field}`],

    onChange: (event) => updateRow(section, index, field, event.target.value),
  })

  return (
    <div className="space-y-6">
      <TagSelector
        label="Skills"
        options={options}
        values={data.skills}
        onChange={(value) => update("skills", value)}
        error={errors.skills}
        notify={notify}
        description="Select the skills you currently have. You can add or change them later."
      />
      <RepeatableSection
        title="Certifications"
        description="Optional. You can continue without certifications."
        items={data.certifications}
        onAdd={() =>
          update("certifications", (latest) => [
            ...latest,

            newItem({
              certification_name: "",

              issuing_organization: "",

              issued_at: "",

              credential_reference: "",
            }),
          ])
        }
        onRemove={(index) => remove("certifications", index, "Certification")}
      >
        {(item, index) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Certification Name"
              required
              {...rowBind("certifications", index, "certification_name")}
            />
            <FormField
              label="Issuing Organization (optional)"
              {...rowBind("certifications", index, "issuing_organization")}
            />
            <FormField
              label="Issue Date (optional)"
              type="date"
              {...rowBind("certifications", index, "issued_at")}
            />
            <FormField
              label="Credential Reference (optional)"
              {...rowBind("certifications", index, "credential_reference")}
            />
          </div>
        )}
      </RepeatableSection>
      <RepeatableSection
        title="Languages"
        description="Optional. Include languages you are comfortable using at work."
        items={data.languages}
        onAdd={() =>
          update("languages", (latest) => [
            ...latest,

            newItem({ language: "", proficiency: "" }),
          ])
        }
        onRemove={(index) => remove("languages", index, "Language")}
      >
        {(item, index) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Language"
              required
              {...rowBind("languages", index, "language")}
            />
            <FormField
              label="Proficiency"
              required
              options={["Basic", "Conversational", "Fluent", "Native"]}
              {...rowBind("languages", index, "proficiency")}
            />
          </div>
        )}
      </RepeatableSection>
      <RepeatableSection
        title="Licenses"
        description="Optional. Add a professional or driving license when relevant."
        items={data.licenses}
        onAdd={() =>
          update("licenses", (latest) => [
            ...latest,

            newItem({ license_name: "", license_number: "", expiry_date: "" }),
          ])
        }
        onRemove={(index) => remove("licenses", index, "License")}
      >
        {(item, index) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="License Name / Type"
              required
              {...rowBind("licenses", index, "license_name")}
            />
            <FormField
              label="License Number (optional)"
              {...rowBind("licenses", index, "license_number")}
            />
            <FormField
              label="Expiry Date (optional)"
              type="date"
              {...rowBind("licenses", index, "expiry_date")}
            />
          </div>
        )}
      </RepeatableSection>
    </div>
  )
}

export function ExperienceStep({ data, update, errors, notify }) {
  const bind = (index, field) => ({
    value: data.experiences[index][field] ?? "",

    error: errors[`experiences.${index}.${field}`],

    onChange: (event) =>
      update("experiences", (latest) =>
        latest.map((item, i) =>
          i === index ? { ...item, [field]: event.target.value } : item,
        ),
      ),
  })

  return (
    <div className="space-y-6">
      <fieldset
        aria-invalid={!!errors.has_experience}
        aria-describedby={
          errors.has_experience ? "experience-choice-error" : undefined
        }
      >
        <legend className="mb-3 text-sm font-semibold">
          Do you have previous work experience?
        </legend>
        <div className="flex gap-3">
          {[true, false].map((answer) => (
            <label
              key={String(answer)}
              className={`flex min-h-12 min-w-24 cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm ${
                data.has_experience === answer
                  ? "border-primary bg-secondary"
                  : "border-border bg-card"
              }`}
            >
              <input
                type="radio"
                name="has_experience"
                checked={data.has_experience === answer}
                onChange={() => {
                  update("has_experience", answer)

                  if (answer && !data.experiences.length)
                    update("experiences", [experienceTemplate()])
                }}
                className="size-4 accent-primary"
              />
              {answer ? "Yes" : "No"}
            </label>
          ))}
        </div>
        <ErrorMessage id="experience-choice-error">
          {errors.has_experience}
        </ErrorMessage>
      </fieldset>
      {data.has_experience === false && (
        <p className="rounded-lg border border-border bg-secondary p-5 text-sm leading-7 text-primary">
          That's okay. PesoMatch also supports fresh graduates and first-time
          jobseekers. You can complete this step without adding work experience.
        </p>
      )}
      {data.has_experience === true && (
        <>
          <ErrorMessage>{errors.experiences}</ErrorMessage>
          <RepeatableSection
            title="Work Experience"
            items={data.experiences}
            onAdd={() =>
              update("experiences", (latest) => [
                ...latest,

                experienceTemplate(),
              ])
            }
            onRemove={(index) => {
              const removed = data.experiences[index]

              update("experiences", (latest) =>
                latest.filter((_, i) => index !== i),
              )

              notify("Experience removed.", {
                undo: () =>
                  update("experiences", (latest) => [
                    ...latest.slice(0, index),

                    removed,

                    ...latest.slice(index),
                  ]),
              })
            }}
          >
            {(item, index) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Job Title"
                  required
                  {...bind(index, "job_title")}
                />
                <FormField
                  label="Company / Organization"
                  required
                  {...bind(index, "company_name")}
                />
                <FormField
                  label="Industry (optional)"
                  {...bind(index, "industry")}
                />
                <FormField
                  label="Employment Type (optional)"
                  options={[
                    "Full-time",

                    "Part-time",

                    "Contract",

                    "Temporary",

                    "Internship",

                    "Self-employed",
                  ]}
                  {...bind(index, "employment_type")}
                />
                <FormField
                  label="Start Date"
                  required
                  type="date"
                  {...bind(index, "start_date")}
                />
                <FormField
                  label="End Date"
                  required={!item.is_current}
                  type="date"
                  disabled={item.is_current}
                  min={item.start_date || undefined}
                  {...bind(index, "end_date")}
                />
                <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
                  <input
                    className="size-4 accent-primary"
                    type="checkbox"
                    checked={item.is_current}
                    onChange={(event) =>
                      update("experiences", (latest) =>
                        latest.map((entry, i) =>
                          i === index
                            ? {
                                ...entry,

                                is_current: event.target.checked,

                                end_date: event.target.checked
                                  ? ""
                                  : entry.end_date,
                              }
                            : entry,
                        ),
                      )
                    }
                  />
                  I currently work here
                </label>
                <div className="sm:col-span-2">
                  <FormField
                    label="Job Description / Responsibilities (optional)"
                    textarea
                    {...bind(index, "description")}
                  />
                </div>
              </div>
            )}
          </RepeatableSection>
        </>
      )}
    </div>
  )
}

const occupations = [
  "Customer Service Representative",

  "Administrative Assistant",

  "Sales Associate",

  "Data Entry Clerk",

  "Bookkeeper",

  "Graphic Designer",

  "Software Developer",

  "Service Crew",

  "Office Assistant",

  "Social Media Assistant",
].map((name) => ({ id: name, name }))

export function PreferencesStep({ data, update, errors, notify }) {
  return (
    <div className="space-y-6">
      <TagSelector
        label="Preferred Job / Occupation"
        options={occupations}
        values={data.occupations}
        onChange={(value) => update("occupations", value)}
        error={errors.occupations}
        allowCustom
        notify={notify}
        description="Choose one or more roles, or add your own."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Preferred Industry (optional)"
          value={data.preferred_industry || ""}
          error={errors.preferred_industry}
          onChange={(event) => update("preferred_industry", event.target.value)}
        />
        <FormField
          label="Preferred Location"
          required
          value={data.preferred_location || ""}
          error={errors.preferred_location}
          helper="Municipality, city, or province where you want to work."
          onChange={(event) => update("preferred_location", event.target.value)}
        />
      </div>
      <CheckGroup
        legend="Employment Type"
        options={["Full-time", "Part-time", "Contract", "Temporary"]}
        value={data.employment_types}
        onChange={(value) => update("employment_types", value)}
        error={errors.employment_types}
      />
      <CheckGroup
        legend="Work Arrangement"
        options={["On-site", "Hybrid", "Remote"]}
        value={data.work_arrangements}
        onChange={(value) => update("work_arrangements", value)}
        error={errors.work_arrangements}
      />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          Willing to Relocate
        </legend>
        <div className="flex gap-5">
          {[true, false].map((answer) => (
            <label
              key={String(answer)}
              className="flex min-h-11 items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="willing_to_relocate"
                className="size-4 accent-primary"
                checked={data.willing_to_relocate === answer}
                onChange={() => update("willing_to_relocate", answer)}
              />
              {answer ? "Yes" : "No"}
            </label>
          ))}
        </div>
        <ErrorMessage>{errors.willing_to_relocate}</ErrorMessage>
      </fieldset>
    </div>
  )
}
