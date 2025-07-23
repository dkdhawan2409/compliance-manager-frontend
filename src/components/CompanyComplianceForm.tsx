import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, isAfter, isToday, parse } from 'date-fns';
import { enAU } from 'date-fns/locale';
import { Tab } from '@headlessui/react';

// Helper to format date as DD/MM/YYYY
const formatDate = (date: Date | null) => (date ? format(date, 'dd/MM/yyyy') : '');

export type CompanyComplianceFormValues = {
  basFrequency: 'Monthly' | 'Quarterly' | 'Yearly';
  nextBasDue: Date | null;
  fbtApplicable: boolean;
  nextFbtDue?: Date | null;
  iasRequired: boolean;
  iasFrequency?: 'Monthly' | 'Quarterly' | 'Yearly';
  nextIasDue?: Date | null;
  financialEndDate: Date | null;
};

const basOptions = ['Monthly', 'Quarterly', 'Yearly'] as const;
const iasOptions = ['Monthly', 'Quarterly'] as const;

export default function CompanyComplianceForm({ onSubmit, defaultValues, deadlines, onAutoFill }: {
  onSubmit: (data: CompanyComplianceFormValues) => void,
  defaultValues?: Partial<CompanyComplianceFormValues>,
  deadlines?: any,
  onAutoFill?: (values: CompanyComplianceFormValues, setValue: (name: keyof CompanyComplianceFormValues, value: any) => void) => void,
}) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<CompanyComplianceFormValues>({
    defaultValues: {
      basFrequency: 'Quarterly',
      nextBasDue: null,
      fbtApplicable: false,
      nextFbtDue: null,
      iasRequired: false,
      iasFrequency: 'Quarterly',
      nextIasDue: null,
      financialEndDate: null,
      ...defaultValues,
    },
  });

  const fbtApplicable = watch('fbtApplicable');
  const iasRequired = watch('iasRequired');
  const basFrequency = watch('basFrequency');
  const iasFrequency = watch('iasFrequency');
  const [fbtFrequency, setFbtFrequency] = React.useState<'Yearly' | 'Quarterly'>('Yearly');

  // Coerce radio values to boolean
  const fbtApplicableValue = String(fbtApplicable) === 'true';
  const iasRequiredValue = String(iasRequired) === 'true';

  // Auto-fill logic
  React.useEffect(() => {
    if (onAutoFill) {
      onAutoFill({
        basFrequency,
        nextBasDue: null,
        fbtApplicable: fbtApplicableValue,
        nextFbtDue: null,
        iasRequired: iasRequiredValue,
        iasFrequency,
        nextIasDue: null,
        financialEndDate: null,
      }, setValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basFrequency, iasFrequency, iasRequiredValue, deadlines]);

  // Helper for date validation (must be today or future)
  const isFutureDate = (date: Date | null): boolean => !!date && (isAfter(date, new Date()) || isToday(date));

  // Helper to get the next due date for monthly deadlines
  function getMonthlyDueDate(dayStr: string) {
    const day = Number(dayStr);
    if (!day || isNaN(day)) return '';
    const now = new Date();
    const today = now.getDate();
    let dueMonth = now.getMonth();
    let dueYear = now.getFullYear();
    if (day < today) {
      dueMonth += 1;
      if (dueMonth > 11) {
        dueMonth = 0;
        dueYear += 1;
      }
    }
    const dueDate = new Date(dueYear, dueMonth, day);
    return formatDate(dueDate);
  }

  // Ensure financialEndDate is always set (hidden field)
  React.useEffect(() => {
    if (!watch('financialEndDate')) {
      // Set to 30 June of current or next year
      const now = new Date();
      let year = now.getMonth() + 1 > 6 ? now.getFullYear() + 1 : now.getFullYear();
      const endDate = new Date(year, 5, 30); // June is month 5 (0-indexed)
      setValue('financialEndDate', endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On submit, if monthly, save only the day number for nextBasDue/nextIasDue
  const handleFormSubmit = (data: CompanyComplianceFormValues) => {
    let submitData = { ...data };
    if (basFrequency === 'Monthly' && deadlines?.bas?.monthly) {
      submitData.nextBasDue = String(deadlines.bas.monthly) as any;
    }
    if (iasRequiredValue && iasFrequency === 'Monthly' && deadlines?.ias?.monthly) {
      submitData.nextIasDue = String(deadlines.ias.monthly) as any;
    }
    onSubmit(submitData);
  };

  const [tabIndex, setTabIndex] = React.useState(0);
  const tabLabels = ['BAS', 'FBT', 'IAS'];

  // Accumulate form data for all tabs
  const [formData, setFormData] = React.useState<Partial<CompanyComplianceFormValues>>({ ...defaultValues });

  // Handler for Next/Back/Save
  const handleNext = (data: CompanyComplianceFormValues) => {
    setFormData(prev => ({ ...prev, ...data }));
    setTabIndex(tabIndex + 1);
  };
  const handleBack = () => setTabIndex(tabIndex - 1);
  const handleSave = (data: CompanyComplianceFormValues) => {
    const allData = { ...formData, ...data };
    handleFormSubmit(allData as CompanyComplianceFormValues);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <div className="mb-6 flex justify-center">
        {tabLabels.map((label, idx) => (
          <button
            key={label}
            className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-all duration-150 ${tabIndex === idx ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-500 bg-white'}`}
            onClick={() => setTabIndex(idx)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <form
        onSubmit={handleSubmit(
          tabIndex === 0
            ? handleNext
            : tabIndex === 1
            ? handleNext
            : handleSave
        )}
        className="space-y-6"
      >
        {tabIndex === 0 && (
          <>
            {/* BAS Frequency */}
            <div>
              <label className="block font-medium mb-1">BAS Frequency <span className="text-red-500">*</span></label>
              <select
                {...register('basFrequency', { required: 'BAS Frequency is required' })}
                className="w-full border rounded px-3 py-2"
              >
                {basOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.basFrequency && <p className="text-red-500 text-sm">{errors.basFrequency.message}</p>}
            </div>
            {/* Next BAS Due */}
            {(() => {
              if (basFrequency === 'Yearly' && deadlines?.annual) {
                const label = deadlines.annual.standard || deadlines.annual.noTaxReturn;
                if (label) {
                  return (
                    <div>
                      <label className="block font-medium mb-1">Next BAS Due (Annual)</label>
                      <div className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700">{label}</div>
                    </div>
                  );
                }
              } else if (basFrequency === 'Monthly' && deadlines?.bas?.monthly) {
                const dateLabel = getMonthlyDueDate(deadlines.bas.monthly);
                return (
                  <div>
                    <label className="block font-medium mb-1">Next BAS Due (Monthly)</label>
                    <div className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700">{dateLabel}</div>
                  </div>
                );
              } else if (basFrequency === 'Quarterly' && deadlines?.bas?.quarterly) {
                const now = new Date();
                const month = now.getMonth() + 1;
                let q = 'q1';
                if (month >= 1 && month <= 3) q = 'q3';
                else if (month >= 4 && month <= 6) q = 'q4';
                else if (month >= 7 && month <= 9) q = 'q1';
                else q = 'q2';
                const label = deadlines.bas.quarterly[q];
                if (label) {
                  return (
                    <div>
                      <label className="block font-medium mb-1">Next BAS Due (Quarterly)</label>
                      <div className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700">{label}</div>
                    </div>
                  );
                }
              }
              // fallback to editable field
              return (
                <div>
                  <label className="block font-medium mb-1">Next BAS Due <span className="text-red-500">*</span></label>
                  <Controller
                    control={control}
                    name="nextBasDue"
                    rules={{
                      required: 'Next BAS Due is required',
                      validate: (value: Date | null | undefined) => isFutureDate(value ?? null) || 'Date must be today or in the future',
                    }}
                    render={({ field }: { field: any }) => (
                      <DatePicker
                        {...field}
                        selected={field.value}
                        onChange={field.onChange}
                        dateFormat="dd/MM/yyyy"
                        className="w-full border rounded px-3 py-2"
                        placeholderText="DD/MM/YYYY"
                        locale={enAU}
                      />
                    )}
                  />
                  {errors.nextBasDue && <p className="text-red-500 text-sm">{errors.nextBasDue.message}</p>}
                </div>
              );
            })()}
          </>
        )}
        {tabIndex === 1 && (
          <>
            {/* FBT Applicable */}
            <div>
              <label className="block font-medium mb-1">FBT Applicable? <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                <label>
                  <input type="radio" value="true" {...register('fbtApplicable', { required: 'Required' })} /> Yes
                </label>
                <label>
                  <input type="radio" value="false" {...register('fbtApplicable', { required: 'Required' })} /> No
                </label>
              </div>
              {errors.fbtApplicable && <p className="text-red-500 text-sm">{errors.fbtApplicable.message}</p>}
            </div>
            {/* FBT Frequency (if applicable) */}
            {fbtApplicableValue && (
              <div>
                <label className="block font-medium mb-1">FBT Frequency <span className="text-red-500">*</span></label>
                <select
                  value={fbtFrequency}
                  onChange={e => setFbtFrequency(e.target.value as 'Yearly' | 'Quarterly')}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Yearly">Yearly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
              </div>
            )}
            {/* Next FBT Due Date (if applicable) */}
            {fbtApplicableValue ? (() => {
              if (fbtFrequency === 'Yearly' && deadlines?.fbt?.annual) {
                const selfLabel = deadlines.fbt.annual.selfLodgement ? formatDate(new Date(deadlines.fbt.annual.selfLodgement)) : 'N/A';
                const agentLabel = deadlines.fbt.annual.taxAgentElectronic ? formatDate(new Date(deadlines.fbt.annual.taxAgentElectronic)) : 'N/A';
                return (
                  <div>
                    <label className="block font-medium mb-1">Next FBT Due Date (Self Lodgement)</label>
                    <div className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700 mb-2">{selfLabel}</div>
                    <label className="block font-medium mb-1">Next FBT Due Date (Tax Agent Electronic)</label>
                    <div className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700">{agentLabel}</div>
                  </div>
                );
              } else if (fbtFrequency === 'Quarterly' && deadlines?.bas?.quarterly) {
                const now = new Date();
                const month = now.getMonth() + 1;
                let q = 'q1';
                if (month >= 1 && month <= 3) q = 'q3';
                else if (month >= 4 && month <= 6) q = 'q4';
                else if (month >= 7 && month <= 9) q = 'q1';
                else q = 'q2';
                const label = deadlines.bas.quarterly[q];
                const formattedLabel = label ? formatDate(new Date(label)) : 'N/A';
                return (
                  <div>
                    <label className="block font-medium mb-1">Next FBT Due Date (Quarterly, matches BAS)</label>
                    <div className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700">{formattedLabel}</div>
                  </div>
                );
              }
              // fallback to editable field
              return (
                <div>
                  <label className="block font-medium mb-1">Next FBT Due Date <span className="text-red-500">*</span></label>
                  <Controller
                    control={control}
                    name="nextFbtDue"
                    rules={{
                      required: 'Next FBT Due Date is required',
                      validate: (value: Date | null | undefined) => isFutureDate(value ?? null) || 'Date must be today or in the future',
                    }}
                    render={({ field }: { field: any }) => (
                      <DatePicker
                        {...field}
                        selected={field.value}
                        onChange={field.onChange}
                        dateFormat="dd/MM/yyyy"
                        className="w-full border rounded px-3 py-2"
                        placeholderText="DD/MM/YYYY"
                        locale={enAU}
                      />
                    )}
                  />
                  {errors.nextFbtDue && <p className="text-red-500 text-sm">{errors.nextFbtDue.message}</p>}
                </div>
              );
            })() : null}
          </>
        )}
        {tabIndex === 2 && (
          <>
            {/* IAS Required */}
            <div>
              <label className="block font-medium mb-1">IAS Required? <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                <label>
                  <input type="radio" value="true" {...register('iasRequired', { required: 'Required' })} /> Yes
                </label>
                <label>
                  <input type="radio" value="false" {...register('iasRequired', { required: 'Required' })} /> No
                </label>
              </div>
              {errors.iasRequired && <p className="text-red-500 text-sm">{errors.iasRequired.message}</p>}
            </div>
            {/* IAS Frequency and Next IAS Due (if required) */}
            {iasRequiredValue && (
              <>
                <div>
                  <label className="block font-medium mb-1">IAS Frequency <span className="text-red-500">*</span></label>
                  <select
                    {...register('iasFrequency', { required: 'IAS Frequency is required' })}
                    className="w-full border rounded px-3 py-2"
                  >
                    {iasOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.iasFrequency && <p className="text-red-500 text-sm">{errors.iasFrequency.message}</p>}
                </div>
                {(() => {
                  if (iasFrequency === 'Monthly' && deadlines?.ias?.monthly) {
                    const dateLabel = getMonthlyDueDate(deadlines.ias.monthly);
                    return (
                      <div>
                        <label className="block font-medium mb-1">Next IAS Due (Monthly)</label>
                        <div className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700">{dateLabel}</div>
                      </div>
                    );
                  } else if (iasFrequency === 'Quarterly' && deadlines?.ias?.quarterly) {
                    const now = new Date();
                    const month = now.getMonth() + 1;
                    let q = 'q1';
                    if (month >= 1 && month <= 3) q = 'q3';
                    else if (month >= 4 && month <= 6) q = 'q4';
                    else if (month >= 7 && month <= 9) q = 'q1';
                    else q = 'q2';
                    const label = deadlines.ias.quarterly[q];
                    if (label) {
                      return (
                        <div>
                          <label className="block font-medium mb-1">Next IAS Due (Quarterly)</label>
                          <div className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700">{label}</div>
                        </div>
                      );
                    }
                  }
                  // fallback to editable field
                  return (
                    <div>
                      <label className="block font-medium mb-1">Next IAS Due <span className="text-red-500">*</span></label>
                      <Controller
                        control={control}
                        name="nextIasDue"
                        rules={{
                          required: 'Next IAS Due is required',
                          validate: (value: Date | null | undefined) => isFutureDate(value ?? null) || 'Date must be today or in the future',
                        }}
                        render={({ field }: { field: any }) => (
                          <DatePicker
                            {...field}
                            selected={field.value}
                            onChange={field.onChange}
                            dateFormat="dd/MM/yyyy"
                            className="w-full border rounded px-3 py-2"
                            placeholderText="DD/MM/YYYY"
                            locale={enAU}
                          />
                        )}
                      />
                      {errors.nextIasDue && <p className="text-red-500 text-sm">{errors.nextIasDue.message}</p>}
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}
        <input type="hidden" {...register('financialEndDate')} />
        <div className="flex justify-between mt-8">
          {tabIndex > 0 && (
            <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300" onClick={handleBack}>Back</button>
          )}
          {tabIndex < tabLabels.length - 1 && (
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-auto">Next</button>
          )}
          {tabIndex === tabLabels.length - 1 && (
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-auto">Save</button>
          )}
        </div>
      </form>
    </div>
  );
} 