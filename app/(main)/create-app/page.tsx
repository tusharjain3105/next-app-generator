"use client";
import JsonViewer from "@/components/JsonViewer";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createAppChoices } from "@/config";
import { createApp } from "@/lib/server-actions";
import { fetch2 } from "@/lib/utils";
import { ValueOfArray } from "@/types";
import { CreateAppSchema, createAppSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@nextui-org/button";
import { Input, InputProps } from "@nextui-org/input";
import {
  Checkbox,
  Select,
  SelectItem,
  SwitchProps,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  VisuallyHidden,
  useSwitch,
} from "@nextui-org/react";
import { Braces, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { UseFormReturn, useForm } from "react-hook-form";
import { useQueries } from "react-query";
import { toast } from "sonner";

const CreateAppPage = () => {
  const form = useForm<CreateAppSchema>({
    resolver: zodResolver(createAppSchema),
    defaultValues: {
      title: "",
      description: "",
      dependencies: [],
      shadcnComponents: [],
      nextuiComponents: [],
      paths: [
        {
          pathname: "/",
          route: false,
          page: true,
          layout: false,
          error: false,
          loading: false,
          template: false,
        },
      ],
    },
  });
  const { dependencies, shadcnComponents, nextuiComponents } = form.watch();
  const [showJson, setShowJson] = useState(false);
  const [isLoading, setTransition] = useTransition();
  const [
    { data: totalShadcnComponents = [], isLoading: loadingShadcnComponents },
    { data: totalNextuiComponents = [], isLoading: loadingNextUIComponents },
  ] = useQueries([
    {
      queryKey: ["components", "shadcn-ui"],
      queryFn: () => fetch2<[]>("/api/components/shadcn-ui"),
      enabled: dependencies.includes("shadcn-ui"),
    },
    {
      queryKey: ["components", "nextui"],
      queryFn: () => fetch2<[]>("/api/components/nextui"),
      enabled: dependencies.includes("nextui"),
    },
  ]);

  const onSubmit = async (data: CreateAppSchema) => {
    setTransition(async () => {
      try {
        await createApp(data);
        toast.success("App is created successfully");
      } catch (e) {
        toast.error(e.message);
      }
    });
  };

  return (
    <div className="max-w-2xl m-auto my-2 md:my-10 bg-gray-50 dark:bg-black/40 p-2 md:p-5 rounded-lg">
      <div className="flex items-center justify-between">
        <div
          className="font-semibold text-warning-600 uppercase"
          onClick={() => console.log(form.watch())}
        >
          {isLoading ? "Creating Next App" : "Create Next App"}
        </div>
        <div>
          <Button
            isIconOnly
            size="sm"
            color="warning"
            onClick={() => setShowJson((p) => !p)}
          >
            <Braces />
          </Button>
        </div>
      </div>
      <Separator className="my-2 md:my-5" />
      {showJson ? (
        <JsonViewer data={form.watch()} />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-2 md:space-y-5"
          >
            <div className="space-y-2 md:space-y-5 max-h-[60vh] overflow-auto">
              <MyFormField form={form} label="Title" name="title" isRequired />
              <MyFormField form={form} label="Description" name="description" />

              <div className="flex gap-2 md:gap-3">
                <div className="flex-1">
                  <MyFormField
                    form={form}
                    label="ORM"
                    name="orm"
                    options={createAppChoices.orm}
                  />
                </div>
                <div className="flex-1">
                  <MyFormField
                    form={form}
                    label="Database"
                    name="db"
                    options={createAppChoices.db}
                  />
                </div>
              </div>

              <MultiSelect
                field="dependencies"
                form={form}
                title="Select Dependencies"
                selectedItems={dependencies}
                totalItems={createAppChoices.dependencies}
              />

              {dependencies.includes("shadcn-ui") && (
                <MultiSelect
                  field="shadcnComponents"
                  form={form}
                  title="Select Shadcn UI Components"
                  selectedItems={shadcnComponents}
                  totalItems={totalShadcnComponents}
                  isLoading={loadingShadcnComponents}
                />
              )}

              {dependencies.includes("nextui") && (
                <MultiSelect
                  field="nextuiComponents"
                  form={form}
                  title="Select NextUI Components"
                  selectedItems={nextuiComponents}
                  totalItems={totalNextuiComponents}
                  isLoading={loadingNextUIComponents}
                />
              )}
            </div>

            <WebsiteStructure form={form} />

            <div className="flex gap-2 justify-end">
              <Button
                type="reset"
                color="warning"
                variant="bordered"
                isDisabled={isLoading}
              >
                Reset
              </Button>
              <Button type="submit" color="warning" isLoading={isLoading}>
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default CreateAppPage;

const WebsiteStructure = ({
  form,
}: {
  form: UseFormReturn<CreateAppSchema>;
}) => {
  const { paths } = form.watch();

  const onChange = (path: (typeof paths)[0], key: string, e: any) => {
    path[key] = e.target.value;
    if (!paths.find((p) => p === path)) {
      paths.push(path);
      if (path.pathname && !path.page && !path.route) {
        if (path.pathname.includes("api")) path.route = true;
        else path.page = true;
      }
    }
    form.setValue(
      "paths",
      paths.filter((p) => p.pathname)
    );
  };

  return (
    <div>
      <div className="flex justify-between mb-2 items-center">
        <Label>Website Structure</Label>
      </div>
      <Table>
        <TableHeader>
          {Object.keys(paths[0]).map((p) => (
            <TableColumn key={p} className="capitalize">
              {p}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {[...paths, {}].map((path) => (
            <TableRow key={path.pathname}>
              {Object.keys(paths[0]).map((key) => (
                <TableCell key={`${path.pathname}-${key}`}>
                  {typeof paths[0][key] === "boolean" ? (
                    <Checkbox isSelected={path[key]} />
                  ) : (
                    <Input
                      placeholder={key}
                      defaultValue={path[key]}
                      onBlur={(e) => onChange(path, key, e)}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const MultiSelect = ({
  field,
  title,
  selectedItems,
  totalItems,
  isLoading = false,
  form,
}) => (
  <div className="space-y-2">
    <div className="flex items-center">
      <Label>{title}</Label>
      {isLoading && (
        <div className="animate-spin ml-2">
          <Loader2 />
        </div>
      )}
    </div>
    {!isLoading && (
      <div className="max-h-[6rem] overflow-auto space-y-2">
        <DependencySwitch
          dependency={"All"}
          isSelected={selectedItems.length === totalItems.length}
          onValueChange={() => {
            form.setValue(
              field,
              selectedItems.length < totalItems.length ? [...totalItems] : []
            );
          }}
        />
        {totalItems.map((dep) => (
          <DependencySwitch
            key={dep}
            dependency={dep}
            isSelected={selectedItems.includes(dep)}
            onValueChange={(value) => {
              form.setValue(
                field,
                value
                  ? [...selectedItems, dep]
                  : selectedItems.filter((p) => p !== dep)
              );
            }}
          />
        ))}
      </div>
    )}
  </div>
);

const DependencySwitch = ({
  dependency,
  ...props
}: {
  dependency: ValueOfArray<typeof createAppChoices.dependencies> | "All";
} & SwitchProps) => {
  const { Component, slots, getBaseProps, getInputProps, getWrapperProps } =
    useSwitch({ ...props, color: "warning" });

  return (
    <Component {...getBaseProps()}>
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <div
        {...getWrapperProps()}
        className={slots.wrapper({
          class: [
            "h-8 w-[unset] px-2",
            "flex items-center justify-center",
            "rounded-lg bg-default-100 hover:bg-default-200",
          ],
        })}
      >
        <span className="text-small">{dependency}</span>
      </div>
    </Component>
  );
};

const MyFormField = ({
  form,
  name,
  options,
  ...props
}: {
  form: UseFormReturn<CreateAppSchema>;
  name: keyof CreateAppSchema;
  options?: readonly (string | { key: string; label: string })[];
} & Omit<InputProps, "form">) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) =>
      options ? (
        <Select {...field} {...(props as any)}>
          {options
            .map((p) => (typeof p === "string" ? { key: p, label: p } : p))
            .map((option) => (
              <SelectItem
                key={option.key}
                value={option.key}
                textValue={option.label}
              >
                {option.label}
              </SelectItem>
            ))}
        </Select>
      ) : (
        <FormItem>
          <FormControl>
            {/* @ts-expect-error */}
            <Input {...field} {...props} disabled={form.formState.isLoading} />
          </FormControl>
        </FormItem>
      )
    }
  />
);
